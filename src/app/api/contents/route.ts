import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { contentCreateSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    const { searchParams } = new URL(req.url);
    
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const pillarId = searchParams.get('pillarId');
    const search = searchParams.get('search');

    let whereClause: any = { workspaceId: workspace.id, status: { not: 'ARCHIVED' } };

    if (status) whereClause.status = status;
    if (platform) whereClause.platform = platform;
    if (pillarId) whereClause.pillarId = pillarId;
    if (search) {
      whereClause.title = { contains: search, mode: 'insensitive' };
    }

    if (role === 'EDITOR') {
      whereClause.OR = [
        { assignedToId: session.user.id },
        { status: 'PUBLISHED' }
      ];
    }

    const contents = await prisma.content.findMany({
      where: whereClause,
      include: {
        pillar: true,
        assignedTo: { select: { id: true, name: true, image: true } },
        campaign: true,
        client: true,
        metrics: { orderBy: { recordedAt: 'desc' }, take: 1 }
      },
      orderBy: [
        { publishDate: 'asc' },
        { publishTime: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(contents);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'OWNER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = contentCreateSchema.parse(body);

    const slug = validatedData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    const content = await prisma.content.create({
      data: {
        ...validatedData,
        publishDate: validatedData.publishDate ? new Date(validatedData.publishDate) : null,
        workspaceId: workspace.id,
        createdById: session.user.id,
        slug,
      }
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: session.user.id,
        entityType: 'CONTENT',
        entityId: content.id,
        action: 'CREATE',
        description: `Dibuat konten: ${content.title}`
      }
    });

    return NextResponse.json(content);
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
