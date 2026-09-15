'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'Kalender', href: '/calendar', icon: '📅' },
  { name: 'Pipeline', href: '/pipeline', icon: '🔄' },
  { name: 'Konten', href: '/contents', icon: '📝' },
  { name: 'Pilar Konten', href: '/pillars', icon: '🏛️' },
  { name: 'Klien', href: '/clients', icon: '👥' },
  { name: 'Proyek', href: '/projects', icon: '📁' },
  { name: 'Keuangan', href: '/finance', icon: '💰', role: 'ADMIN' },
  { name: 'Analytics', href: '/analytics', icon: '📈', role: 'ALL' },
  { name: 'Google Sheets', href: '/sheets', icon: '📊', role: 'ADMIN' },
  { name: 'Google Docs', href: '/docs', icon: '📄', role: 'ADMIN' },
  { name: 'Integrasi', href: '/settings/integrations', icon: '🔗', role: 'ADMIN' },
  { name: 'Notifikasi', href: '/settings/notifications', icon: '🔔', role: 'ALL' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <span className="text-2xl mr-2">📋</span>
        <span className="text-xl font-bold">ContentPlanner</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
                  'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                )}
              >
                <span className="mr-3 text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <p className="text-xs text-center text-zinc-500">
          v1.0.0 &bull; Free Plan
        </p>
      </div>
    </div>
  );
}
