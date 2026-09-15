import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    
    const connection = await prisma.googleConnection.findFirst({
      where: { workspaceId: workspace.id, isActive: true }
    });

    if (connection) {
      return NextResponse.json({
        googleConnected: true,
        googleInfo: { email: connection.googleEmail }
      });
    }

    return NextResponse.json({ googleConnected: false });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
