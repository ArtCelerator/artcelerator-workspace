export const dynamic = "force-dynamic";
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
    
    const contents = await prisma.content.findMany({
      where: { workspaceId: workspace.id, assignedToId: session.user.id },
      include: { metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } }
    });

    let totalEng = 0;
    const statusCounts: Record<string, number> = {};
    const performanceData: any[] = [];

    contents.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      
      const m = c.metrics[0];
      if (m && c.status === 'PUBLISHED') {
        const eng = m.likes + m.comments + m.shares + m.saves;
        totalEng += eng;
        performanceData.push({ name: c.title.substring(0, 15) + '...', engagement: eng });
      }
    });

    const publishedCount = statusCounts['PUBLISHED'] || 0;

    return NextResponse.json({
      user: session.user,
      totalContents: contents.length,
      publishedCount,
      avgEngagement: publishedCount ? Math.round(totalEng / publishedCount) : 0,
      statusCounts: Object.keys(statusCounts).map(name => ({ name, value: statusCounts[name] })),
      performanceData: performanceData.slice(-10) // Last 10 contents
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
