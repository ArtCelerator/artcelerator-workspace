export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { getValidAccessToken, getSheetsClient, formatContentForSheet, generateSheetHeaders } from '@/lib/google';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role === 'EDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { clientId, emailToShare } = body;

    const accessToken = await getValidAccessToken(workspace.ownerId, workspace.id);
    if (!accessToken) return NextResponse.json({ error: 'Google Not Connected' }, { status: 400 });

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const contents = await prisma.content.findMany({
      where: { workspaceId: workspace.id, clientId },
      include: {
        pillar: true, client: true, project: true, assignedTo: true,
        metrics: { orderBy: { recordedAt: 'desc' }, take: 1 }
      },
      orderBy: { publishDate: 'asc' }
    });

    const sheets = getSheetsClient(accessToken);
    const spreadsheetTitle = `Progress Report - ${client.name} - ${new Date().toLocaleDateString('id-ID')}`;

    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: spreadsheetTitle },
        sheets: [
          { properties: { title: 'Sudah Published' } },
          { properties: { title: 'Konten Terjadwal' } }
        ]
      }
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;
    const spreadsheetUrl = spreadsheet.data.spreadsheetUrl!;

    // Split contents
    const published = contents.filter(c => c.status === 'PUBLISHED');
    const scheduled = contents.filter(c => c.status !== 'PUBLISHED');

    const headers = generateSheetHeaders();
    
    // Write Published
    if (published.length >= 0) {
      const pRows = published.map(formatContentForSheet);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sudah Published!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers, ...pRows] }
      });
    }

    // Write Scheduled
    if (scheduled.length >= 0) {
      const sRows = scheduled.map(formatContentForSheet);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Konten Terjadwal!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers, ...sRows] }
      });
    }

    // Share to email if provided
    if (emailToShare) {
      const { google } = require('googleapis');
      const authClient = new google.auth.OAuth2();
      authClient.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth: authClient });
      
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: { type: 'user', role: 'reader', emailAddress: emailToShare },
        sendNotificationEmail: true
      });
    }

    // Save sync info
    await prisma.sheetSync.create({
      data: {
        workspaceId: workspace.id,
        clientId: client.id,
        spreadsheetId,
        spreadsheetUrl,
        sheetName: 'All Sheets', // special case
        syncStatus: 'ACTIVE',
        lastSyncAt: new Date()
      }
    });

    return NextResponse.json({ success: true, url: spreadsheetUrl });
  } catch (error: any) {
    console.error('Client Progress Sheet Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
