import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { getValidAccessToken, getDocsClient } from '@/lib/google';
import { processTemplate, generateDataSnapshot } from '@/lib/template-engine';
import { google } from 'googleapis';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    const body = await req.json();
    const { templateId, contentId, clientId, projectId, period } = body;

    const template = await prisma.docTemplate.findUnique({ where: { id: templateId } });
    if (!template || template.workspaceId !== workspace.id) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const accessToken = await getValidAccessToken(session.user.id, workspace.id);
    if (!accessToken) return NextResponse.json({ error: 'Google Not Connected' }, { status: 400 });

    // Generate snapshot data
    const snapshotParams = { contentId, clientId, projectId, month: period?.split('-')[1], year: period?.split('-')[0] };
    const snapshotData = await generateDataSnapshot(template.type, snapshotParams);

    // Process template text
    const processedContent = processTemplate(template.content || '', snapshotData);

    // Title generation
    let docTitle = `[${template.type.toUpperCase()}]`;
    if (template.type === 'brief') docTitle += ` - ${snapshotData.content_title}`;
    else if (template.type === 'report') docTitle += ` - ${snapshotData.client} - ${snapshotData.month} ${snapshotData.year}`;
    else if (template.type === 'invoice_cover') docTitle += ` - ${snapshotData.client} - ${snapshotData.invoice_no}`;
    
    // Create Doc
    const docs = getDocsClient(accessToken);
    const createRes = await docs.documents.create({
      requestBody: { title: docTitle }
    });
    
    const docId = createRes.data.documentId!;
    
    // Insert text
    if (processedContent.trim()) {
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: processedContent
              }
            }
          ]
        }
      });
    }

    // Determine folder
    let folderId = undefined;
    if (clientId || projectId) {
      const searchId = projectId || clientId;
      const folder = await prisma.driveFolder.findFirst({ where: { OR: [{ projectId: searchId }, { clientId: searchId }] } });
      if (folder) folderId = folder.folderId;
    }

    if (folderId) {
      // Move to folder
      const { getDriveClient } = require('@/lib/google');
      const drive = getDriveClient(accessToken);
      const file = await drive.files.get({ fileId: docId, fields: 'parents' });
      const previousParents = file.data.parents?.join(',') || '';
      await drive.files.update({
        fileId: docId,
        addParents: folderId,
        removeParents: previousParents
      });
    }

    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

    const generated = await prisma.generatedDoc.create({
      data: {
        workspaceId: workspace.id,
        templateId: template.id,
        clientId: clientId || null,
        projectId: projectId || null,
        contentId: contentId || null,
        title: docTitle,
        docId,
        docUrl,
        type: template.type,
        generatedBy: session.user.id,
        data: snapshotData
      }
    });

    return NextResponse.json(generated);
  } catch (error: any) {
    console.error('Generate Doc Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
