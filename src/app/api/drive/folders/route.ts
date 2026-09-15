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
    if (role === 'TEAM') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { clientId, projectId } = body;

    const accessToken = await getValidAccessToken(workspace.ownerId, workspace.id);
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

      return NextResponse.json({ success: true, folderId: pFolder.id });
    }

    
    if (body.contentId && projectId) {
      // Create Content folders
      const content = await prisma.content.findUnique({ where: { id: body.contentId } });
      if (!content) throw new Error('Content not found');
      
      const projectFolder = await prisma.driveFolder.findFirst({ where: { projectId, parentId: { not: null }, contentId: null } });
      if (!projectFolder) throw new Error('Project folder not found');

      const cFolder = await createFolder(content.title, projectFolder.folderId);
      const dbContent = await prisma.driveFolder.create({
        data: { workspaceId: workspace.id, projectId, clientId, contentId: content.id, folderId: cFolder.id, folderUrl: cFolder.url, name: content.title, path: `${projectFolder.path}/${content.title}`, parentId: projectFolder.id }
      });

      const subFolders = ['Assets', 'Output'];
      for (const sub of subFolders) {
        const subF = await createFolder(sub, cFolder.id);
        await prisma.driveFolder.create({
          data: { workspaceId: workspace.id, projectId, clientId, contentId: content.id, folderId: subF.id, folderUrl: subF.url, name: sub, path: `${dbContent.path}/${sub}`, parentId: dbContent.id }
        });
      }
      
      // We return the content folder ID so the caller can create docs inside it
      return NextResponse.json({ success: true, folderId: cFolder.id, dbFolderId: dbContent.id });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error) {
    console.error('Folder creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
