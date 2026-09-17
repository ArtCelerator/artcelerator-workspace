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
    // 1. Get current session
    const session = await auth();
    
    // 2. Check if user is authenticated
    if (!session || !session.user || !session.user.id) {
      throw new Error('Unauthorized access');
    }

    const userId = session.user.id;

    // 3. Get workspace and verify it exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    // 4. Verify workspace exists
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // 5. Check user permission (is member && role is ADMIN)
    const currentUserMember = workspace.members[0];
    if (!currentUserMember) {
      throw new Error('You are not a member of this workspace');
    }

    if (currentUserMember.role !== 'ADMIN') {
      throw new Error('Only Admin can invite new members');
    }

    // 7. Validate email format with basic regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // 6. Check if email already member
    // First find if the user exists in the system by email
    const invitedUser = await prisma.user.findUnique({
      where: { email }
    });

    if (invitedUser) {
      // Check if they are already in the workspace
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: invitedUser.id
        }
      });

      if (existingMember) {
        return { success: false, error: 'User is already a member of this workspace' };
      }
    }

    // 8. Get current user data for inviterName
    const inviterName = session.user.name || 'A team member';

    // 9. Generate invite link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Using encodeURIComponent to safely encode the email and role
    const inviteLink = `${appUrl}/register?email=${encodeURIComponent(email)}&workspace=${encodeURIComponent(workspaceId)}&role=${encodeURIComponent(role)}`;

    // 10. Call sendInvitationEmail()
    await sendInvitationEmail({
      to: email,
      inviterName,
      workspaceName: workspace.name,
      role: role.toString().replace(/_/g, ' '),
      inviteLink
    });

    // 11. Revalidate path
    revalidatePath(`/workspace/${workspaceId}/team`);
    revalidatePath(`/dashboard/workspace/${workspaceId}/team`);
    revalidatePath(`/team`);

    // 12. Return success response
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
