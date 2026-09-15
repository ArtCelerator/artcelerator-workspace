export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { clientSchema } from '@/lib/validations';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    
    const client = await prisma.client.findFirst({
      where: { id: params.id, workspaceId: workspace.id },
      include: {
        contacts: true,
        clientNotes: { orderBy: { createdAt: 'desc' } },
        _count: { select: { projects: true, contents: true } },
        invoices: {
          where: { status: 'PAID' },
          select: { total: true }
        }
      }
    });

    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const totalRevenue = client.invoices.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);

    return NextResponse.json({ ...client, totalRevenue });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'ADMIN' && role !== 'CREATIVE_DIRECTOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const validatedData = clientSchema.partial().parse(body);

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        contractStart: validatedData.contractStart ? new Date(validatedData.contractStart) : undefined,
        contractEnd: validatedData.contractEnd ? new Date(validatedData.contractEnd) : undefined,
      }
    });

    return NextResponse.json(client);
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'ADMIN' && role !== 'CREATIVE_DIRECTOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.client.update({
      where: { id: params.id },
      data: { status: 'CHURNED' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
