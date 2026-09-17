'use server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendInvitationEmail } from '@/lib/email-gas';
import { revalidatePath } from 'next/cache';
import { WorkspaceRole } from '@prisma/client';

export async function inviteMemberToWorkspace(
  workspaceId: string,
  email: string,
  role: WorkspaceRole
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // b. Get session
    const session = await auth();
    
    // c. Check if user is authenticated & email exists
    if (!session || !session.user || !session.user.email) {
      return { success: false, error: 'Unauthorized access or missing email' };
    }

    const userEmail = session.user.email;

    // d. Query workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });

    // e. Verify workspace exists
    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    // f. Find current user in workspace.members by email
    const currentUserMember = workspace.members.find(
      member => member.user.email === userEmail
    );

    // g. Return error if user is not a member
    if (!currentUserMember) {
      return { success: false, error: 'You are not a member of this workspace' };
    }

    // h. Check permission
    // i. Return error if not ADMIN
    if (currentUserMember.role !== 'ADMIN') {
      return { success: false, error: 'Only workspace admins can invite new members' };
    }

    // j. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // k. Check if email already member
    const existingMember = workspace.members.find(
      member => member.user.email === email
    );

    // l. Return error if already member
    if (existingMember) {
      return { success: false, error: 'User is already a member of this workspace' };
    }

    // m. Generate invite link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl}/register?email=${encodeURIComponent(email)}&workspace=${encodeURIComponent(workspaceId)}&role=${encodeURIComponent(role)}`;

    // n. Get inviter name
    const inviterName = session.user.name || session.user.email || 'Team Admin';

    // o. Map role to display name
    let roleDisplayName = 'Team Member';
    if (role === 'ADMIN') roleDisplayName = 'Admin';
    else if (role === 'CREATIVE_DIRECTOR') roleDisplayName = 'Creative Director';

    // p. Call sendInvitationEmail
    await sendInvitationEmail({
      to: email,
      inviterName,
      workspaceName: workspace.name,
      role: roleDisplayName,
      inviteLink
    });

    // q. Revalidate path
    revalidatePath(`/workspace/${workspaceId}/team`);

    // r. Return success
    return { 
      success: true, 
      message: `Invitation successfully sent to ${email}`
    };

  } catch (error: any) {
    console.error('[inviteMemberToWorkspace] Error:', error.message);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred while inviting the member'
    };
  }
}
