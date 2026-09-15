export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { clientSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let whereClause: any = { workspaceId: workspace.id, status: { not: 'CHURNED' } };
    if (status) whereClause.status = status;
    if (search) whereClause.name = { contains: search, mode: 'insensitive' };

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        _count: { select: { projects: true, contents: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role !== 'OWNER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = clientSchema.parse(body);

    const slug = validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        contractStart: validatedData.contractStart ? new Date(validatedData.contractStart) : null,
        contractEnd: validatedData.contractEnd ? new Date(validatedData.contractEnd) : null,
        workspaceId: workspace.id,
        slug
      }
    });

    // Fire and forget folder creation
    try {
      const url = new URL(req.url);
      fetch(`${url.origin}/api/drive/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.get('cookie') || '' },
        body: JSON.stringify({ clientId: client.id })
      }).catch(e => console.error('Drive auto-create error:', e));
    } catch(e) {}

    return NextResponse.json(client);
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
