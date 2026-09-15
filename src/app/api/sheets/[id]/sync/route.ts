import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getValidAccessToken, getSheetsClient, formatContentForSheet } from '@/lib/google';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const syncRecord = await prisma.sheetSync.findUnique({
      where: { id: params.id },
      include: { workspace: { select: { ownerId: true } } }
    });

    if (!syncRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const accessToken = await getValidAccessToken(session.user.id, syncRecord.workspaceId);
    if (!accessToken) return NextResponse.json({ error: 'Google Not Connected' }, { status: 400 });

    const where: any = { workspaceId: syncRecord.workspaceId };
    if (syncRecord.clientId) where.clientId = syncRecord.clientId;
    if (syncRecord.projectId) where.projectId = syncRecord.projectId;

    const contents = await prisma.content.findMany({
      where,
      include: {
        pillar: true, client: true, project: true, assignedTo: true,
        metrics: { orderBy: { recordedAt: 'desc' }, take: 1 }
      },
      orderBy: { publishDate: 'asc' }
    });

    const sheets = getSheetsClient(accessToken);
    const rows = contents.map(formatContentForSheet);

    // Clear A2:Z
    await sheets.spreadsheets.values.clear({
      spreadsheetId: syncRecord.spreadsheetId,
      range: `${syncRecord.sheetName}!A2:Z`
    });

    // Write new data
    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: syncRecord.spreadsheetId,
        range: `${syncRecord.sheetName}!A2`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows }
      });
    }

    const updated = await prisma.sheetSync.update({
      where: { id: syncRecord.id },
      data: { lastSyncAt: new Date() }
    });

    return NextResponse.json({ success: true, lastSyncAt: updated.lastSyncAt });
  } catch (error: any) {
    console.error('Sheets Sync Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
