import prisma from './prisma';
import { seedDefaultTemplates } from './seed-templates';

export async function getOrCreateDefaultWorkspace(userId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true }
  });

  if (member) return { workspace: member.workspace, role: member.role };

  // Generate unique slug to prevent P2002 error
  const uniqueId = Math.random().toString(36).substring(2, 7);
  const slug = `workspace-${Date.now()}-${uniqueId}`;

  const newWorkspace = await prisma.workspace.create({
    data: {
      name: 'My Agency Workspace',
      slug,
      ownerId: userId,
      members: {
        create: { userId, role: 'ADMIN' }
      }
    }
  });
  
  await seedDefaultTemplates(newWorkspace.id);

  return { workspace: newWorkspace, role: 'ADMIN' as const };
}
