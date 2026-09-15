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

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    const where: any = { workspaceId: workspace.id };
    if (clientId) where.clientId = clientId;

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: { select: { name: true } },
        contents: { include: { metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } } },
        expenses: { select: { amount: true } }
      }
    });

    const data = projects.map(p => {
      const spent = p.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const published = p.contents.filter(c => c.status === 'PUBLISHED').length;
      
      let engagement = 0;
      p.contents.forEach(c => {
        const m = c.metrics[0];
        if (m) engagement += m.likes + m.comments + m.shares + m.saves;
      });

      return {
        id: p.id,
        name: p.name,
        clientName: p.client.name,
        budget: p.budget || 0,
        spent,
        engagement,
        publishedCount: published,
        totalContents: p.contents.length,
        roi: spent > 0 ? (engagement / spent).toFixed(4) : 0,
        status: p.status
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
