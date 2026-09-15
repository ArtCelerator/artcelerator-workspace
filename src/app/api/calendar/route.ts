import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { STATUS_COLORS } from '@/lib/constants';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    const { searchParams } = new URL(req.url);
    
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 });
    }

    const whereClause: any = {
      workspaceId: workspace.id,
      publishDate: {
        gte: new Date(start),
        lte: new Date(end)
      },
      status: { not: 'ARCHIVED' }
    };

    if (role === 'EDITOR') {
      whereClause.OR = [
        { assignedToId: session.user.id },
        { status: 'PUBLISHED' }
      ];
    }

    const contents = await prisma.content.findMany({
      where: whereClause,
      include: {
        pillar: true,
        assignedTo: { select: { id: true, name: true, image: true } }
      }
    });

    const events = contents.map(c => {
      // Create start time combining publishDate and publishTime if available
      let startDateTime = c.publishDate?.toISOString().split('T')[0];
      if (c.publishTime) {
        startDateTime = `${startDateTime}T${c.publishTime}:00`;
      }

      // Default color handling, extract from STATUS_COLORS or use pillar color
      let color = '#3b82f6'; // default blue
      if (c.status === 'PUBLISHED') color = '#10b981';
      else if (c.status === 'SCHEDULED') color = '#9333ea';
      else if (c.status === 'REVIEW') color = '#eab308';
      else if (c.status === 'DRAFTING') color = '#3b82f6';
      else if (c.status === 'IDEA') color = '#6b7280';
      
      if (c.pillar?.color) {
        // Option to use pillar color instead
        color = c.pillar.color;
      }

      return {
        id: c.id,
        title: c.title,
        start: startDateTime,
        allDay: !c.publishTime,
        color,
        extendedProps: {
          platform: c.platform,
          contentType: c.contentType,
          status: c.status,
          assignedTo: c.assignedTo?.name || 'Unassigned',
          pillarName: c.pillar?.name
        }
      };
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Calendar API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
