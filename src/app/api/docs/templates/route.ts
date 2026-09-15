import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { extractVariables } from '@/lib/template-engine';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    const templates = await prisma.docTemplate.findMany({
      where: { workspaceId: workspace.id, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role === 'EDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const variables = extractVariables(body.content || '');

    const template = await prisma.docTemplate.create({
      data: {
        workspaceId: workspace.id,
        name: body.name,
        type: body.type,
        content: body.content,
        variables,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
