export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { invoiceSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    const invoices = await prisma.invoice.findMany({
      where: { workspaceId: workspace.id },
      include: { client: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'OWNER' && role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const validated = invoiceSchema.parse(body);

    const subtotal = validated.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const total = subtotal + validated.tax - validated.discount;

    // Generate Invoice No
    const count = await prisma.invoice.count({ where: { workspaceId: workspace.id } });
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        workspaceId: workspace.id,
        invoiceNo,
        clientId: validated.clientId,
        projectId: validated.projectId || null,
        title: validated.title,
        issueDate: new Date(validated.issueDate),
        dueDate: new Date(validated.dueDate),
        subtotal,
        tax: validated.tax,
        discount: validated.discount,
        total,
        notes: validated.notes,
        status: 'DRAFT',
        items: {
          create: validated.items.map((item, i) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice
          }))
        }
      },
      include: { items: true, client: true }
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
