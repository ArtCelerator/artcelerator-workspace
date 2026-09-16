export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);

    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId: workspace.id },
      include: {
        client: { select: { name: true } },
        contents: { select: { status: true, metrics: { select: { likes: true, comments: true, shares: true, saves: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedCampaigns = campaigns.map(camp => {
      const totalContents = camp.contents.length;
      const publishedContents = camp.contents.filter(c => c.status === 'PUBLISHED').length;
      const progress = totalContents > 0 ? Math.round((publishedContents / totalContents) * 100) : 0;
      
      let totalEngagement = 0;
      camp.contents.forEach(c => {
        c.metrics.forEach(m => {
          totalEngagement += (m.likes + m.comments + m.shares + m.saves);
        });
      });

      return {
        ...camp,
        progress,
        publishedContents,
        totalContents,
        totalEngagement,
        clientName: camp.client?.name || '-'
      };
    });

    return NextResponse.json(enrichedCampaigns);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
