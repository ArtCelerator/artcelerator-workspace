import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const clientId = searchParams.get('clientId');
    const projectId = searchParams.get('projectId');
    const contentId = searchParams.get('contentId');

    const where: any = { workspaceId: workspace.id };
    if (type) where.type = type;
    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;
    if (contentId) where.contentId = contentId;

    const docs = await prisma.generatedDoc.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
