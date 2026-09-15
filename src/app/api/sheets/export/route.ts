export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { getValidAccessToken, getSheetsClient, generateSheetHeaders, formatContentForSheet } from '@/lib/google';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role === 'EDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { clientId, projectId, month, year, autoSync } = body;

    const accessToken = await getValidAccessToken(workspace.ownerId, workspace.id);
    if (!accessToken) return NextResponse.json({ error: 'Google Not Connected' }, { status: 400 });

    const where: any = { workspaceId: workspace.id };
    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;
    
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.publishDate = { gte: startDate, lte: endDate };
    }

    const contents = await prisma.content.findMany({
      where,
      include: {
        pillar: true, client: true, project: true, assignedTo: true,
        metrics: { orderBy: { recordedAt: 'desc' }, take: 1 }
      },
      orderBy: { publishDate: 'asc' }
    });

    const sheets = getSheetsClient(accessToken);
    
    // Create new spreadsheet
    const titleInfo = clientId ? (await prisma.client.findUnique({where:{id:clientId}}))?.name : 'Semua Klien';
    const spreadsheetTitle = `Content Plan - ${titleInfo} - ${new Date().toLocaleDateString('id-ID')}`;
    const sheetName = month && year ? `${month}/${year}` : 'Export';

    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: spreadsheetTitle },
        sheets: [{ properties: { title: sheetName } }]
      }
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;
    const spreadsheetUrl = spreadsheet.data.spreadsheetUrl!;
    const createdSheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId || 0;

    // Prepare data
    const headers = generateSheetHeaders();
    const rows = contents.map(formatContentForSheet);
    const values = [headers, ...rows];

    // Write data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });

    // Formatting
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId: createdSheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          },
          {
            updateSheetProperties: {
              properties: { sheetId: createdSheetId, gridProperties: { frozenRowCount: 1 } },
              fields: 'gridProperties.frozenRowCount'
            }
          }
        ]
      }
    });

    // Save sync info if autoSync is true or even if one-time to keep track
    const syncStatus = autoSync ? 'ACTIVE' : 'PAUSED';
    await prisma.sheetSync.create({
      data: {
        workspaceId: workspace.id,
        clientId: clientId || null,
        projectId: projectId || null,
        spreadsheetId,
        spreadsheetUrl,
        sheetName,
        syncStatus,
        lastSyncAt: new Date()
      }
    });

    return NextResponse.json({ success: true, url: spreadsheetUrl });
  } catch (error: any) {
    console.error('Sheets Export Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
