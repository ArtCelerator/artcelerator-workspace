export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new Response('Unauthorized', { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'OWNER' && role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const where: any = { workspaceId: workspace.id };
    if (startDate && endDate) {
      where.publishDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const contents = await prisma.content.findMany({
      where,
      include: { pillar: true, client: true, project: true, assignedTo: true, metrics: { take: 1, orderBy: { recordedAt: 'desc' } } },
      orderBy: { publishDate: 'desc' }
    });

    const headers = ['Judul', 'Platform', 'Tipe', 'Tanggal Publish', 'Klien', 'Proyek', 'Status', 'PIC', 'Likes', 'Comments', 'Shares', 'Saves', 'Reach', 'Impressions'];
    
    const escapeCsv = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;
    
    const rows = contents.map(c => {
      const m = c.metrics[0];
      return [
        escapeCsv(c.title),
        escapeCsv(c.platform),
        escapeCsv(c.contentType),
        escapeCsv(c.publishDate ? new Date(c.publishDate).toISOString().split('T')[0] : ''),
        escapeCsv(c.client?.name),
        escapeCsv(c.project?.name),
        escapeCsv(c.status),
        escapeCsv(c.assignedTo?.name),
        m?.likes || 0,
        m?.comments || 0,
        m?.shares || 0,
        m?.saves || 0,
        m?.reach || 0,
        m?.impressions || 0
      ].join(',');
    });

    const csvData = [headers.join(','), ...rows].join('\n');

    return new Response(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export_contents_${new Date().getTime()}.csv"`
      }
    });
  } catch (error) {
    return new Response('Error', { status: 500 });
  }
}
