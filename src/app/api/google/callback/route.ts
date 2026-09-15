import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getGoogleAuth } from '@/lib/google';
import { google } from 'googleapis';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.redirect(new URL('/login', req.url));

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const workspaceId = searchParams.get('state');

    if (!code || !workspaceId) return NextResponse.redirect(new URL('/settings/integrations?error=invalid_callback', req.url));

    const oauth2Client = getGoogleAuth();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    if (!userInfo.data.email || !userInfo.data.id) {
       return NextResponse.redirect(new URL('/settings/integrations?error=no_email', req.url));
    }

    // Upsert google connection
    await prisma.googleConnection.upsert({
      where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
      create: {
        userId: session.user.id,
        workspaceId,
        googleAccountId: userInfo.data.id,
        googleEmail: userInfo.data.email,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        tokenExpiry: new Date(tokens.expiry_date!),
        scopes: tokens.scope?.split(' ') || [],
        isActive: true
      },
      update: {
        googleAccountId: userInfo.data.id,
        googleEmail: userInfo.data.email,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        tokenExpiry: new Date(tokens.expiry_date!),
        scopes: tokens.scope?.split(' ') || [],
        isActive: true
      }
    });

    // Auto-create root folder for workspace if it doesn't exist
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Check if root folder already exists in our DB
    const existingRoot = await prisma.driveFolder.findFirst({
      where: { workspaceId, parentId: null }
    });

    if (!existingRoot) {
      // Create in Google Drive
      const folderMetadata = {
        name: `[ArtCelerator] ${workspace?.name || 'Workspace'}`,
        mimeType: 'application/vnd.google-apps.folder',
      };
      const res = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id, webViewLink'
      });

      if (res.data.id) {
        await prisma.driveFolder.create({
          data: {
            workspaceId,
            folderId: res.data.id,
            folderUrl: res.data.webViewLink || '',
            name: folderMetadata.name,
            path: '/'
          }
        });
      }
    }

    return NextResponse.redirect(new URL('/settings/integrations?success=google_connected', req.url));
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.redirect(new URL('/settings/integrations?error=internal_error', req.url));
  }
}
