export const dynamic = "force-dynamic";
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NotificationsClient from './client';
import { Suspense } from 'react';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <Suspense fallback={<div className="pt-16 min-h-screen bg-zinc-50 flex justify-center"><div className="animate-pulse pt-10 text-zinc-500">Memuat...</div></div>}>
      <NotificationsClient />
    </Suspense>
  );
}
