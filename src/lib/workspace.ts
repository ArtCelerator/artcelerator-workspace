import prisma from './prisma';
import { seedDefaultTemplates } from './seed-templates';

export async function getOrCreateDefaultWorkspace(userId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true }
  });

  if (member) return { workspace: member.workspace, role: member.role };

  // Generate unique slug
  const count = await prisma.workspace.count();
  const slug = `workspace-${count + 1}`;

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
