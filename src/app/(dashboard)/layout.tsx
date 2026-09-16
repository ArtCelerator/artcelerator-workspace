export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Suspense } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  // Auto create or get default workspace
  const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Suspense fallback={<div className="w-64 bg-white border-r" />}>
        <Sidebar role={role} />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={session.user} workspaceName={workspace.name} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
