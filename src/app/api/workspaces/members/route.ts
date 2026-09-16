export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { sendTeamInviteEmail } from '@/lib/email';

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

    let userToInvite = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;
    
    if (!userToInvite) {
      userToInvite = await prisma.user.create({
        data: { email, name: email.split('@')[0] }
      });
      isNewUser = true;
    }

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
        joinedAt: isNewUser ? null : new Date()
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } }
      }
    });

    // Send email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = isNewUser 
      ? `${appUrl}/register?email=${encodeURIComponent(email)}&workspace=${workspace.id}`
      : `${appUrl}/dashboard`;

    await sendTeamInviteEmail({
      toEmail: email,
      inviterName: session.user.name || 'Admin',
      workspaceName: workspace.name,
      roleName: newRole || 'TEAM',
      inviteLink
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to invite member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
