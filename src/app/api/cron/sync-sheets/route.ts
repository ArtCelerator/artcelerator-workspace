import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getValidAccessToken, getSheetsClient, formatContentForSheet } from '@/lib/google';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    // Very simple cron security check
    if (token !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeSyncs = await prisma.sheetSync.findMany({
      where: { syncStatus: 'ACTIVE' },
      include: { workspace: { select: { ownerId: true } } }
    });

    let successCount = 0;
    let errorCount = 0;

    for (const syncRecord of activeSyncs) {
      try {
        // Use workspace owner's token for background sync
        const accessToken = await getValidAccessToken(syncRecord.workspace.ownerId, syncRecord.workspaceId);
        if (!accessToken) throw new Error('No valid token');

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

        await sheets.spreadsheets.values.clear({
          spreadsheetId: syncRecord.spreadsheetId,
          range: `${syncRecord.sheetName}!A2:Z`
        });

        if (rows.length > 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: syncRecord.spreadsheetId,
            range: `${syncRecord.sheetName}!A2`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: rows }
          });
        }

        await prisma.sheetSync.update({
          where: { id: syncRecord.id },
          data: { lastSyncAt: new Date(), lastError: null }
        });

        successCount++;
      } catch (e: any) {
        console.error(`Error syncing sheet ${syncRecord.id}:`, e);
        errorCount++;
        await prisma.sheetSync.update({
          where: { id: syncRecord.id },
          data: { lastError: e.message || 'Unknown error' }
        });
      }
    }

    return NextResponse.json({ success: true, processed: activeSyncs.length, successCount, errorCount });
  } catch (error) {
    console.error('CRON Sheets Sync Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
