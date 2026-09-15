export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    const workspaceId = workspace.id;

    // Dates for filtering
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 8); // +8 to include up to day 7 end

    // 1. Get total contents
    const totalContent = await prisma.content.count({
      where: { workspaceId }
    });

    // 2. Count per status
    const statusCounts = await prisma.content.groupBy({
      by: ['status'],
      where: { workspaceId },
      _count: true
    });

    const stats = {
      total: totalContent,
      idea: statusCounts.find(s => s.status === 'IDEA')?._count || 0,
      drafting: statusCounts.find(s => s.status === 'DRAFTING')?._count || 0,
      scheduled: statusCounts.find(s => s.status === 'SCHEDULED')?._count || 0,
      published: statusCounts.find(s => s.status === 'PUBLISHED')?._count || 0,
    };

    // 3. Today's content
    const todayContent = await prisma.content.findMany({
      where: {
        workspaceId,
        publishDate: today
      },
      orderBy: { publishTime: 'asc' },
      select: { id: true, title: true, platform: true, publishTime: true, status: true }
    });

    // 4. Overdue content
    const overdue = await prisma.content.findMany({
      where: {
        workspaceId,
        publishDate: { lt: today },
        status: { notIn: ['PUBLISHED', 'ARCHIVED'] }
      },
      orderBy: { publishDate: 'asc' },
      select: { id: true, title: true, platform: true, publishDate: true, status: true }
    });

    // 5. Upcoming content (next 7 days)
    const upcoming = await prisma.content.findMany({
      where: {
        workspaceId,
        publishDate: { gte: tomorrow, lt: next7Days },
        status: { notIn: ['ARCHIVED'] }
      },
      orderBy: { publishDate: 'asc' },
      select: { id: true, title: true, platform: true, publishDate: true, publishTime: true, status: true }
    });

    // 6. Pillar Distribution
    const pillars = await prisma.contentPillar.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { contents: true }
        }
      }
    });

    const pillarDistribution = pillars.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      count: p._count.contents,
      targetPercentage: p.percentage
    }));

    return NextResponse.json({
      stats,
      todayContent,
      overdue,
      upcoming,
      pillarDistribution
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
