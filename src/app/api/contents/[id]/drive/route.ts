export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { createContentDriveStructure } from '@/lib/googleDriveStructure';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role === 'TEAM') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const content = await prisma.content.findUnique({
      where: { id: params.id, workspaceId: workspace.id }
    });

    if (!content) return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    if (!content.clientId || !content.projectId) {
      return NextResponse.json({ error: 'Konten harus memiliki Klien dan Proyek' }, { status: 400 });
    }

    const driveResult = await createContentDriveStructure({
      workspaceId: workspace.id,
      ownerId: workspace.ownerId,
      clientId: content.clientId,
      projectId: content.projectId,
      contentId: content.id,
      contentTitle: content.title
    });

    if (driveResult?.error) {
      return NextResponse.json({ error: driveResult.error }, { status: 500 });
    }
    if (driveResult?.skipped) {
      return NextResponse.json({ error: 'Google Drive belum terhubung' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Drive creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
