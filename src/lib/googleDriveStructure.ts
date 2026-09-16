import prisma from '@/lib/prisma';
import { getValidAccessToken, getDriveClient, getDocsClient } from '@/lib/google';

export async function createContentDriveStructure({
  workspaceId,
  ownerId,
  clientId,
  projectId,
  contentId,
  contentTitle
}: {
  workspaceId: string;
  ownerId: string;
  clientId: string;
  projectId: string;
  contentId: string;
  contentTitle: string;
}) {
  try {
    const accessToken = await getValidAccessToken(ownerId, workspaceId);
    if (!accessToken) {
      return { skipped: true, reason: 'no connection' };
    }

    const drive = getDriveClient(accessToken);
    const docs = getDocsClient(accessToken);

    const rootFolder = await prisma.driveFolder.findFirst({ where: { workspaceId, parentId: null } });
    if (!rootFolder) {
      return { error: 'Root folder not found' };
    }

    const createGoogleFolder = async (name: string, parentId: string) => {
      const res = await drive.files.create({
        requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
        fields: 'id, webViewLink'
      });
      return { id: res.data.id!, url: res.data.webViewLink! };
    };

    const createGoogleDoc = async (title: string, parentId: string) => {
      // Create empty doc in drive folder
      const res = await drive.files.create({
        requestBody: { name: title, mimeType: 'application/vnd.google-apps.document', parents: [parentId] },
        fields: 'id, webViewLink'
      });
      return { id: res.data.id!, url: res.data.webViewLink! };
    };

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!client || !project) return { error: 'Client or project not found' };

    // 1. Ensure Client Folder
    let clientFolder = await prisma.driveFolder.findFirst({ where: { workspaceId, clientId, parentId: rootFolder.id } });
    if (!clientFolder) {
      const gFolder = await createGoogleFolder(client.name, rootFolder.folderId);
      clientFolder = await prisma.driveFolder.create({
        data: { workspaceId, clientId, folderId: gFolder.id, folderUrl: gFolder.url, name: client.name, path: `/${client.name}`, parentId: rootFolder.id }
      });
    }

    // 2. Ensure Project Folder
    let projectFolder = await prisma.driveFolder.findFirst({ where: { workspaceId, projectId, parentId: clientFolder.id, contentId: null } });
    if (!projectFolder) {
      const gFolder = await createGoogleFolder(project.name, clientFolder.folderId);
      projectFolder = await prisma.driveFolder.create({
        data: { workspaceId, clientId, projectId, folderId: gFolder.id, folderUrl: gFolder.url, name: project.name, path: `${clientFolder.path}/${project.name}`, parentId: clientFolder.id }
      });
    }

    // 3. Create Content Folder
    const contentGFolder = await createGoogleFolder(contentTitle, projectFolder.folderId);
    const contentFolder = await prisma.driveFolder.create({
      data: { workspaceId, clientId, projectId, contentId, folderId: contentGFolder.id, folderUrl: contentGFolder.url, name: contentTitle, path: `${projectFolder.path}/${contentTitle}`, parentId: projectFolder.id }
    });

    // 4. Create Assets and Output Folders
    const subFolders = ['Assets', 'Output'];
    for (const sub of subFolders) {
      const subGFolder = await createGoogleFolder(sub, contentGFolder.id);
      await prisma.driveFolder.create({
        data: { workspaceId, clientId, projectId, contentId, folderId: subGFolder.id, folderUrl: subGFolder.url, name: sub, path: `${contentFolder.path}/${sub}`, parentId: contentFolder.id }
      });
    }

    // 5. Create Brief and Referensi Docs
    const docTypes = [
      { type: 'brief', title: `Brief - ${contentTitle}` },
      { type: 'referensi', title: `Referensi - ${contentTitle}` }
    ];

    for (const dType of docTypes) {
      const gDoc = await createGoogleDoc(dType.title, contentGFolder.id);
      await prisma.generatedDoc.create({
        data: {
          workspaceId,
          clientId,
          projectId,
          contentId,
          title: dType.title,
          docId: gDoc.id,
          docUrl: gDoc.url,
          type: dType.type,
          generatedBy: ownerId
        }
      });
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
