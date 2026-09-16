export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import SettingsClient from './client';
import { Suspense } from 'react';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { workspace, role } = await getOrCreateDefaultWorkspace(session.user.id);
  
  if (role !== 'ADMIN') {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-zinc-300">403</h1>
          <p className="text-lg text-zinc-600 font-medium">Akses Ditolak</p>
          <p className="text-zinc-500">Halaman ini hanya dapat diakses oleh Admin / Manajemen Agensi.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8">Memuat pengaturan...</div>}>
      <SettingsClient workspace={workspace} user={session.user} />
    </Suspense>
  );
}
