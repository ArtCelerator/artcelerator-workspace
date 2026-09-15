import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { getGoogleAuth } from '@/lib/google';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    
    const connection = await prisma.googleConnection.findUnique({
      where: { userId_workspaceId: { userId: session.user.id, workspaceId: workspace.id } }
    });

    if (connection) {
      // Revoke token
      try {
        const oauth2Client = getGoogleAuth();
        await oauth2Client.revokeToken(connection.refreshToken);
      } catch (e) {
        console.error('Failed to revoke token', e);
      }
      
      await prisma.googleConnection.delete({
        where: { id: connection.id }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
