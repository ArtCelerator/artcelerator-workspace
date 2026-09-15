export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { getValidAccessToken, getSheetsClient } from '@/lib/google';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role === 'EDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { spreadsheetId, sheetName, columnMapping, clientId, projectId } = body;
    // columnMapping: { title: 'A', platform: 'B', publishDate: 'C', status: 'D' }

    if (!spreadsheetId || !sheetName || !columnMapping) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(workspace.ownerId, workspace.id);
    if (!accessToken) return NextResponse.json({ error: 'Google Not Connected' }, { status: 400 });

    const sheets = getSheetsClient(accessToken);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:Z` // skip header
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, importedCount: 0, message: 'No data found' });
    }

    // Helper to get column index from letter (A -> 0, B -> 1)
    const getColIndex = (letter: string) => {
      if (!letter) return -1;
      return letter.toUpperCase().charCodeAt(0) - 65;
    };

    const titleIdx = getColIndex(columnMapping.title);
    const platformIdx = getColIndex(columnMapping.platform);
    const statusIdx = getColIndex(columnMapping.status);
    const dateIdx = getColIndex(columnMapping.publishDate);

    let importedCount = 0;
    const contentsToCreate = [];

    for (const row of rows) {
      const title = titleIdx >= 0 ? row[titleIdx] : null;
      if (!title) continue; // Skip if no title

      const platform = platformIdx >= 0 ? row[platformIdx] : 'INSTAGRAM';
      const status = statusIdx >= 0 ? row[statusIdx] : 'DRAFTING';
      const dateStr = dateIdx >= 0 ? row[dateIdx] : null;

      let publishDate = null;
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) publishDate = parsed;
      }

      contentsToCreate.push({
        workspaceId: workspace.id,
        title,
        platform: platform || 'INSTAGRAM' as any,
        contentType: 'SOCIAL_POST' as any,
        status: status || 'DRAFTING' as any,
        publishDate,
        clientId: clientId || null,
        projectId: projectId || null,
        createdById: session.user.id, slug: `import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      });
      importedCount++;
    }

    if (contentsToCreate.length > 0) {
      await prisma.content.createMany({
        data: contentsToCreate,
        skipDuplicates: true
      });
    }

    return NextResponse.json({ success: true, importedCount });
  } catch (error: any) {
    console.error('Sheets Import Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
