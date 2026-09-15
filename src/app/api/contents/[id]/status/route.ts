export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { canChangeStatus } from '@/lib/permissions';
import { contentStatusSchema } from '@/lib/validations';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    const existing = await prisma.content.findFirst({
      where: { id: params.id, workspaceId: workspace.id }
    });

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { status: newStatus } = contentStatusSchema.parse(body);

    const isAssigned = existing.assignedToId === session.user.id;
    if (!canChangeStatus(role as any, existing.status as any, newStatus as any, isAssigned)) {
      return NextResponse.json({ error: 'Forbidden transition' }, { status: 403 });
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    const content = await prisma.content.update({
      where: { id: params.id },
      data: updateData
    });

    const { notifyRole, notifyAssigned } = require('@/lib/notification-service');
    if (newStatus === 'SCHEDULED') {
      await notifyAssigned({ contentId: content.id, type: 'CONTENT_APPROVED', title: 'Konten Disetujui', message: `Konten "${content.title}" telah disetujui.` });
    } else if (newStatus === 'DRAFTING') {
      await notifyAssigned({ contentId: content.id, type: 'CONTENT_REJECTED', priority: 'IMPORTANT', title: 'Konten Direvisi', message: `Konten "${content.title}" memerlukan revisi.` });
    } else if (newStatus === 'REVIEW') {
      await notifyRole({ workspaceId: workspace.id, role: ['OWNER', 'ADMIN'], type: 'CONTENT_REVIEW_REQUESTED', title: 'Review Dibutuhkan', message: `Konten "${content.title}" menunggu review Anda.`, link: `/contents/${content.id}` });
    }

    await prisma.activityLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: session.user.id,
        entityType: 'CONTENT',
        entityId: content.id,
        action: 'UPDATE_STATUS',
        description: `Status diubah dari ${existing.status} ke ${newStatus}`
      }
    });

    return NextResponse.json(content);
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
