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

    // Fetch all published contents and their latest metrics
    const contents = await prisma.content.findMany({
      where: { workspaceId: workspace.id, status: 'PUBLISHED' },
      include: {
        metrics: { orderBy: { recordedAt: 'desc' }, take: 1 },
        client: { select: { name: true } }
      }
    });

    let totalEngagement = 0;
    let totalReach = 0;
    let totalImpressions = 0;
    const platformCount: Record<string, number> = {};

    const contentStats = contents.map(c => {
      const m = c.metrics[0];
      const eng = m ? m.likes + m.comments + m.shares + m.saves : 0;
      const reach = m ? m.reach : 0;
      const impressions = m ? m.impressions : 0;
      
      totalEngagement += eng;
      totalReach += reach;
      totalImpressions += impressions;
      
      platformCount[c.platform] = (platformCount[c.platform] || 0) + 1;

      return {
        id: c.id,
        title: c.title,
        platform: c.platform,
        clientName: c.client?.name || '-',
        engagement: eng,
        reach,
        publishedAt: c.publishedAt || c.publishDate
      };
    });

    const topContents = [...contentStats].sort((a, b) => b.engagement - a.engagement).slice(0, 5);

    // Group engagement by week (last 12 weeks)
    // Simplified: just grouping by week string
    const weeks: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const key = `W${d.getDate()}/${d.getMonth()+1}`;
      weeks[key] = 0;
    }
    
    // Fill weeks
    contentStats.forEach(c => {
      if (!c.publishedAt) return;
      const d = new Date(c.publishedAt);
      if (now.getTime() - d.getTime() > 12 * 7 * 24 * 60 * 60 * 1000) return; // Older than 12 weeks
      // Find closest week key (rough approximation for MVP)
      const key = `W${d.getDate()}/${d.getMonth()+1}`;
      if (weeks[key] !== undefined) weeks[key] += c.engagement;
    });

    const trend = Object.keys(weeks).map(name => ({ name, engagement: weeks[name] }));

    return NextResponse.json({
      totalEngagement,
      totalReach,
      totalImpressions,
      totalPublished: contents.length,
      platformCount: Object.keys(platformCount).map(name => ({ name, count: platformCount[name] })),
      topContents,
      trend,
      growthPct: 15 // Placeholder for MVP
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
