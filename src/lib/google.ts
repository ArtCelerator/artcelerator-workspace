import { google } from 'googleapis';
import prisma from '@/lib/prisma';

export function getGoogleAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback` 
    : 'http://localhost:3000/api/google/callback';

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getDriveClient(accessToken: string) {
  const auth = getGoogleAuth();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

export async function refreshAccessToken(refreshToken: string) {
  const auth = getGoogleAuth();
  auth.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await auth.refreshAccessToken();
  return credentials;
}

export async function getValidAccessToken(userId: string, workspaceId: string) {
  const connection = await prisma.googleConnection.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  });

  if (!connection || !connection.isActive) return null;

  // Check if token is expired or expires in less than 5 minutes (300000ms)
  if (connection.tokenExpiry.getTime() - Date.now() < 300000) {
    try {
      const newCreds = await refreshAccessToken(connection.refreshToken);
      const updated = await prisma.googleConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: newCreds.access_token!,
          tokenExpiry: new Date(newCreds.expiry_date!),
          ...(newCreds.refresh_token ? { refreshToken: newCreds.refresh_token } : {})
        }
      });
      return updated.accessToken;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      // If refresh fails (e.g., revoked), mark inactive
      await prisma.googleConnection.update({
        where: { id: connection.id },
        data: { isActive: false }
      });
      return null;
    }
  }

  return connection.accessToken;
}

export function getSheetsClient(accessToken: string) {
  const auth = getGoogleAuth();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: 'v4', auth });
}

export function getDocsClient(accessToken: string) {
  const auth = getGoogleAuth();
  auth.setCredentials({ access_token: accessToken });
  return google.docs({ version: 'v1', auth });
}

export function generateSheetHeaders() {
  return [
    'Tanggal Publish',
    'Jam',
    'Platform',
    'Format',
    'Judul',
    'Status',
    'Pilar Konten',
    'Klien',
    'Proyek',
    'Assignee',
    'Caption',
    'Total Engagement',
    'Total Reach'
  ];
}

export function formatContentForSheet(content: any) {
  const m = content.metrics?.[0];
  const engagement = m ? (m.likes + m.comments + m.shares + m.saves) : 0;
  const reach = m ? m.reach : 0;
  
  return [
    content.publishDate ? new Date(content.publishDate).toISOString().split('T')[0] : '',
    content.publishTime || '',
    content.platform,
    content.contentType,
    content.title,
    content.status,
    content.pillar?.name || '',
    content.client?.name || '',
    content.project?.name || '',
    content.assignedTo?.name || '',
    content.caption || '',
    engagement,
    reach
  ];
}

export async function createDriveFolder(accessToken: string, name: string, parentId?: string) {
  const drive = getDriveClient(accessToken);
  const fileMetadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    fileMetadata.parents = [parentId];
  }
  
  const res = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, webViewLink',
  });
  
  return {
    id: res.data.id!,
    url: res.data.webViewLink!
  };
}
