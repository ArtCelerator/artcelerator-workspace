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

    const clients = await prisma.client.findMany({
      where: { workspaceId: workspace.id },
      include: {
        contents: {
          where: { status: 'PUBLISHED' },
          include: { metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } }
        }
      }
    });

    const data = clients.map(client => {
      let engagement = 0;
      let reach = 0;
      
      client.contents.forEach(c => {
        const m = c.metrics[0];
        if (m) {
          engagement += m.likes + m.comments + m.shares + m.saves;
          reach += m.reach;
        }
      });

      return {
        id: client.id,
        name: client.name,
        engagement,
        reach,
        contentCount: client.contents.length,
        growthPct: Math.floor(Math.random() * 20) - 5 // Mock growth for MVP
      };
    });

    data.sort((a, b) => b.engagement - a.engagement);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
