export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { getValidAccessToken, getDriveClient } from '@/lib/google';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    const body = await req.json();
    const { email, role } = body; // role: reader, commenter, writer

    const folder = await prisma.driveFolder.findUnique({ where: { id: params.id } });
    if (!folder || folder.workspaceId !== workspace.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const accessToken = await getValidAccessToken(workspace.ownerId, workspace.id);
    if (!accessToken) return NextResponse.json({ error: 'Google Not Connected' }, { status: 400 });

    const drive = getDriveClient(accessToken);
    
    await drive.permissions.create({
      fileId: folder.folderId,
      requestBody: {
        type: 'user',
        role: role,
        emailAddress: email
      },
      sendNotificationEmail: true
    });

    await prisma.driveFolder.update({
      where: { id: folder.id },
      data: {
        sharedWith: email,
        sharePermission: role
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
