import prisma from '@/lib/prisma';

export function extractVariables(template: string): string[] {
  const regex = /{{([\w.|]+)}}/g;
  const matches = Array.from(template.matchAll(regex));
  return [...new Set(matches.map(m => m[1]))];
}

export function processTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/{{([\w.|]+)}}/g, (match, expression) => {
    const [path, filter] = expression.split('|');
    const keys = path.split('.');
    
    let value = data;
    for (const key of keys) {
      if (value == null) break;
      value = value[key];
    }
    
    if (value == null) return '';

    if (filter === 'currency') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(value));
    }
    if (filter === 'date') {
      return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    return String(value);
  });
}

export async function generateDataSnapshot(type: string, params: any) {
  if (type === 'brief' && params.contentId) {
    const content = await prisma.content.findUnique({
      where: { id: params.contentId },
      include: { client: true, project: true, assignedTo: true }
    });
    return {
      client: content?.client?.name || '-',
      project: content?.project?.name || '-',
      content_title: content?.title || '-',
      platform: content?.platform || '-',
      deadline: content?.publishDate || null,
      pic: content?.assignedTo?.name || '-'
    };
  }

  if (type === 'report' && params.clientId && params.month && params.year) {
    const client = await prisma.client.findUnique({ where: { id: params.clientId } });
    const startDate = new Date(parseInt(params.year), parseInt(params.month) - 1, 1);
    const endDate = new Date(parseInt(params.year), parseInt(params.month), 0);
    
    const contents = await prisma.content.findMany({
      where: { clientId: params.clientId, publishDate: { gte: startDate, lte: endDate }, status: 'PUBLISHED' },
      include: { metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } }
    });

    let totalEng = 0, totalReach = 0;
    contents.forEach(c => {
      const m = c.metrics[0];
      if (m) {
        totalEng += (m.likes + m.comments + m.shares + m.saves);
        totalReach += m.reach;
      }
    });

    return {
      client: client?.name || '-',
      month: startDate.toLocaleDateString('id-ID', { month: 'long' }),
      year: params.year,
      total_content: contents.length,
      engagement: totalEng,
      reach: totalReach,
      top_content: contents.length > 0 ? contents[0].title : '-',
      growth: 0 // Mock growth
    };
  }

  if (type === 'invoice_cover' && params.invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
      include: { client: true }
    });
    return {
      client: invoice?.client?.name || '-',
      invoice_no: invoice?.invoiceNo || '-',
      month: invoice?.issueDate ? new Date(invoice.issueDate).toLocaleDateString('id-ID', { month: 'long' }) : '-',
      amount: invoice?.total || 0
    };
  }

  return {};
}
