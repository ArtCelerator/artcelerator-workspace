export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get('contentId');
    const folderId = searchParams.get('folderId');

    const where: any = { workspaceId: workspace.id };
    if (contentId) where.contentId = contentId;
    if (folderId) where.folderId = folderId;

    const files = await prisma.driveFile.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    await prisma.driveFile.delete({
      where: { id, workspaceId: workspace.id }
    });
    
    // Note: To completely delete from Google Drive, we would also call drive.files.delete
    // For MVP, deleting from DB is sufficient to remove it from UI

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
