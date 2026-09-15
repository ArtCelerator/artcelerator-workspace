export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { getValidAccessToken, getDriveClient } from '@/lib/google';
import { Readable } from 'stream';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;
    const contentId = formData.get('contentId') as string;
    
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const accessToken = await getValidAccessToken(workspace.ownerId, workspace.id);
    if (!accessToken) return NextResponse.json({ error: 'Google Not Connected' }, { status: 400 });

    // Determine destination Google Drive folder ID
    let driveFolderId = null;
    if (folderId) {
       const dbFolder = await prisma.driveFolder.findUnique({ where: { id: folderId } });
       if (dbFolder) driveFolderId = dbFolder.folderId;
    }
    if (!driveFolderId) {
      const root = await prisma.driveFolder.findFirst({ where: { workspaceId: workspace.id, parentId: null } });
      if (root) driveFolderId = root.folderId;
    }

    const drive = getDriveClient(accessToken);
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const res = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: driveFolderId ? [driveFolderId] : undefined
      },
      media: {
        mimeType: file.type,
        body: Readable.from(buffer)
      },
      fields: 'id, webViewLink, webContentLink, mimeType'
    });

    if (!res.data.id) throw new Error('Upload failed');

    const dbFile = await prisma.driveFile.create({
      data: {
        workspaceId: workspace.id,
        folderId: folderId || null,
        contentId: contentId || null,
        fileId: res.data.id,
        fileUrl: res.data.webContentLink || res.data.webViewLink || '',
        webViewLink: res.data.webViewLink || null,
        uploadedBy: session.user.id,
        name: file.name,
        mimeType: file.type,
        fileType: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT'
      }
    });

    return NextResponse.json(dbFile);
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
