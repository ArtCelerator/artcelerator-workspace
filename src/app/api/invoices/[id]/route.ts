export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, workspaceId: workspace.id },
      include: {
        items: true,
        payments: true,
        client: true,
        project: true
      }
    });

    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'ADMIN' && role !== 'CREATIVE_DIRECTOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.invoice.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
