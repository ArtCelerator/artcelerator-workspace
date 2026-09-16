export const dynamic = "force-dynamic";
import { auth } from '@/lib/auth';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { redirect } from 'next/navigation';
import TeamClient from './client';

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
  
  if (role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <TeamClient workspaceId={workspace.id} currentUserRole={role} />;
}
