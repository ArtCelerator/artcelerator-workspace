export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { getValidAccessToken, getDriveClient } from '@/lib/google';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
    if (role === 'EDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { clientId, projectId } = body;

    const accessToken = await getValidAccessToken(session.user.id, workspace.id);
    if (!accessToken) return NextResponse.json({ error: 'Google Not Connected' }, { status: 400 });

    const drive = getDriveClient(accessToken);
    
    // Find root workspace folder
    const rootFolder = await prisma.driveFolder.findFirst({ where: { workspaceId: workspace.id, parentId: null } });
    if (!rootFolder) return NextResponse.json({ error: 'Root folder not found' }, { status: 400 });

    const createFolder = async (name: string, parentId: string) => {
      const res = await drive.files.create({
        requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
        fields: 'id, webViewLink'
      });
      return { id: res.data.id!, url: res.data.webViewLink! };
    };

    if (clientId && !projectId) {
      // Create Client folders
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      if (!client) throw new Error('Client not found');
      
      const cFolder = await createFolder(client.name, rootFolder.folderId);
      const dbClient = await prisma.driveFolder.create({
        data: { workspaceId: workspace.id, clientId, folderId: cFolder.id, folderUrl: cFolder.url, name: client.name, path: `/${client.name}`, parentId: rootFolder.id }
      });
      
      const f1 = await createFolder('Contracts', cFolder.id);
      const f2 = await createFolder('Shared', cFolder.id);
      
      await prisma.driveFolder.createMany({
        data: [
          { workspaceId: workspace.id, clientId, folderId: f1.id, folderUrl: f1.url, name: 'Contracts', path: `/${client.name}/Contracts`, parentId: dbClient.id },
          { workspaceId: workspace.id, clientId, folderId: f2.id, folderUrl: f2.url, name: 'Shared', path: `/${client.name}/Shared`, parentId: dbClient.id }
        ]
      });

      return NextResponse.json({ success: true, folderId: cFolder.id });
    }

    if (projectId && clientId) {
      // Create Project folders
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) throw new Error('Project not found');
      
      const clientFolder = await prisma.driveFolder.findFirst({ where: { clientId, parentId: rootFolder.id } });
      if (!clientFolder) throw new Error('Client folder not found');

      const pFolder = await createFolder(project.name, clientFolder.folderId);
      const dbProj = await prisma.driveFolder.create({
        data: { workspaceId: workspace.id, projectId, clientId, folderId: pFolder.id, folderUrl: pFolder.url, name: project.name, path: `${clientFolder.path}/${project.name}`, parentId: clientFolder.id }
      });

      const subFolders = ['Briefs', 'Assets', 'Drafts', 'Finals', 'Reports'];
      for (const sub of subFolders) {
        const subF = await createFolder(sub, pFolder.id);
        await prisma.driveFolder.create({
          data: { workspaceId: workspace.id, projectId, clientId, folderId: subF.id, folderUrl: subF.url, name: sub, path: `${dbProj.path}/${sub}`, parentId: dbProj.id }
        });
      }

      return NextResponse.json({ success: true, folderId: pFolder.id });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error) {
    console.error('Folder creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
