export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { paymentSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    const payments = await prisma.payment.findMany({
      where: {
        invoice: { workspaceId: workspace.id }
      },
      include: {
        invoice: { select: { invoiceNo: true, client: { select: { name: true } } } }
      },
      orderBy: { paidAt: 'desc' }
    });

    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'ADMIN' && role !== 'CREATIVE_DIRECTOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const validated = paymentSchema.parse(body);

    const payment = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: validated.invoiceId } });
      if (!invoice) throw new Error('Invoice not found');

      const createdPayment = await tx.payment.create({
        data: {
          invoiceId: validated.invoiceId,
          amount: validated.amount,
          method: validated.method,
          reference: validated.reference || null,
          paidAt: new Date(validated.paidAt),
          notes: validated.notes || null
        }
      });

      // Calculate total payments for this invoice
      const allPayments = await tx.payment.findMany({ where: { invoiceId: invoice.id } });
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Update invoice status
      let status = invoice.status;
      if (totalPaid >= Number(invoice.total)) {
        status = 'PAID';
      } else if (totalPaid > 0) {
        status = 'PARTIALLY_PAID';
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status }
      });

      return createdPayment;
    });

    return NextResponse.json(payment);
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
