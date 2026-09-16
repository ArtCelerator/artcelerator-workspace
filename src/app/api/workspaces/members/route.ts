export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } }
      },
      orderBy: { joinedAt: 'asc' }
    });

    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { email, role: newRole } = body;

    // Check if user exists
    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) {
      return NextResponse.json({ error: 'User dengan email tersebut belum terdaftar di aplikasi.' }, { status: 404 });
    }

    // Check if already in workspace
    const existing = await prisma.workspaceMember.findFirst({
      where: { workspaceId: workspace.id, userId: userToInvite.id }
    });

    if (existing) {
      return NextResponse.json({ error: 'User sudah berada di dalam tim.' }, { status: 400 });
    }

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: userToInvite.id,
        role: newRole || 'TEAM',
        joinedAt: new Date()
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } }
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
