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
    if (role === 'EDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        workspace: {
          select: {
            contents: {
              where: { status: 'PUBLISHED' },
              include: { metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } }
            }
          }
        }
      }
    });

    // Group contents by user
    const data = members.map(member => {
      const userContents = member.workspace.contents.filter(c => c.assignedToId === member.user.id);
      
      let totalEng = 0;
      let totalReach = 0;
      
      userContents.forEach(c => {
        const m = c.metrics[0];
        if (m) {
          totalEng += m.likes + m.comments + m.shares + m.saves;
          totalReach += m.reach;
        }
      });

      return {
        id: member.user.id,
        name: member.user.name,
        image: member.user.image,
        contentCount: userContents.length,
        avgEngagement: userContents.length ? Math.round(totalEng / userContents.length) : 0,
        totalReach,
        onTimeRate: 95, // Placeholder MVP
        rejectionRate: 5 // Placeholder MVP
      };
    });

    data.sort((a, b) => b.avgEngagement - a.avgEngagement);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
