export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const metrics = await prisma.contentMetric.findMany({
      where: { contentId: params.id },
      orderBy: { recordedAt: 'desc' }
    });
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'ADMIN' && role !== 'CREATIVE_DIRECTOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const metric = await prisma.contentMetric.create({
      data: {
        contentId: params.id,
        likes: body.likes || 0,
        comments: body.comments || 0,
        shares: body.shares || 0,
        saves: body.saves || 0,
        reach: body.reach || 0,
        impressions: body.impressions || 0,
        clicks: body.clicks || 0,
        views: body.views || 0,
        watchTime: body.watchTime || 0
      }
    });

    return NextResponse.json(metric);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
