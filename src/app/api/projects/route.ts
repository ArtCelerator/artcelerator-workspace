export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { projectSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let whereClause: any = { workspaceId: workspace.id, status: { not: 'CANCELLED' } };
    if (clientId) whereClause.clientId = clientId;
    if (status) whereClause.status = status;
    if (search) whereClause.name = { contains: search, mode: 'insensitive' };

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        _count: { select: { contents: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(projects);
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
    const validated = projectSchema.parse(body);
    const slug = validated.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    const project = await prisma.project.create({
      data: {
        ...validated,
        workspaceId: workspace.id,
        slug,
        startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
        endDate: validated.endDate ? new Date(validated.endDate) : new Date(),
      }
    });

    // Automatically add the creator as a member
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: session.user.id,
        role: 'MANAGER'
      }
    });

    // Fire and forget folder creation
    try {
      const url = new URL(req.url);
      fetch(`${url.origin}/api/drive/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.get('cookie') || '' },
        body: JSON.stringify({ projectId: project.id, clientId: validated.clientId })
      }).catch(e => console.error('Drive auto-create error:', e));
    } catch(e) {}

    return NextResponse.json(project);
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
