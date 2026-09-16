export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export async function PUT(req: Request, { params }: { params: { memberId: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { role: newRole } = body;

    // Prevent removing the last admin
    const member = await prisma.workspaceMember.findFirst({
      where: { id: params.memberId, workspaceId: workspace.id }
    });

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    if (member.role === 'ADMIN' && newRole !== 'ADMIN') {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId: workspace.id, role: 'ADMIN' }
      });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Tidak dapat mengubah role Admin terakhir.' }, { status: 400 });
      }
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: params.memberId },
      data: { role: newRole }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { memberId: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const member = await prisma.workspaceMember.findFirst({
      where: { id: params.memberId, workspaceId: workspace.id }
    });

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    if (member.role === 'ADMIN') {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId: workspace.id, role: 'ADMIN' }
      });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Tidak dapat menghapus Admin terakhir.' }, { status: 400 });
      }
    }

    await prisma.workspaceMember.delete({
      where: { id: params.memberId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
