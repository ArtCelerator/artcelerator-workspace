export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { canEditContent, canDeleteContent } from '@/lib/permissions';
import { contentUpdateSchema } from '@/lib/validations';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    
    const content = await prisma.content.findFirst({
      where: { id: params.id, workspaceId: workspace.id },
      include: {
        pillar: true,
        assignedTo: { select: { id: true, name: true, image: true } },
        campaign: true,
        client: true,
        metrics: { orderBy: { recordedAt: 'desc' }, take: 1 },
        driveFolders: true,
        generatedDocs: true
      }
    });

    if (!content) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    const existing = await prisma.content.findFirst({
      where: { id: params.id, workspaceId: workspace.id }
    });

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!canEditContent(role as any, existing.createdById, existing.assignedToId, existing.status as any, session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = contentUpdateSchema.parse(body);

    const content = await prisma.content.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        publishDate: validatedData.publishDate ? new Date(validatedData.publishDate) : null,
      }
    });

    return NextResponse.json(content);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (!canDeleteContent(role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.content.findFirst({
      where: { id: params.id, workspaceId: workspace.id }
    });

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.content.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
