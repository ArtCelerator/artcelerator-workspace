'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { WorkspaceRole } from '@/lib/constants';

type NavCategory = {
  title: string;
  items: NavItem[];
};

type NavItem = {
  name: string;
  href: string;
  icon: string;
  allowedRoles: WorkspaceRole[];
};

const navigation: NavCategory[] = [
  {
    title: 'Utama',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: '🏠', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR', 'TEAM'] },
      { name: 'Kalender', href: '/calendar', icon: '📅', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR', 'TEAM'] },
      { name: 'Pipeline', href: '/pipeline', icon: '🔄', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR', 'TEAM'] },
      { name: 'Konten', href: '/contents', icon: '📝', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR', 'TEAM'] },
    ]
  },
  {
    title: 'Agensi & Proyek',
    items: [
      { name: 'Klien', href: '/clients', icon: '👥', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR'] },
      { name: 'Proyek', href: '/projects', icon: '📁', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR'] },
      { name: 'Kampanye', href: '/campaigns', icon: '🎯', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR'] },
    ]
  },
  {
    title: 'Finansial & Analytics',
    items: [
      { name: 'Keuangan', href: '/finance', icon: '💰', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR'] },
      { name: 'Performa', href: '/analytics', icon: '📈', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR', 'TEAM'] },
      { name: 'Google Sheets', href: '/sheets', icon: '📊', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR'] },
      { name: 'Google Docs', href: '/docs', icon: '📄', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR'] },
    ]
  },
  {
    title: 'Pengaturan',
    items: [
      { name: 'Pilar & Tag', href: '/pillars', icon: '🏛️', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR'] },
      { name: 'Kelola Tim', href: '/team', icon: '👥', allowedRoles: ['ADMIN'] },
      { name: 'Integrasi', href: '/settings/integrations', icon: '🔗', allowedRoles: ['ADMIN'] },
      { name: 'Notifikasi', href: '/settings/notifications', icon: '🔔', allowedRoles: ['ADMIN', 'CREATIVE_DIRECTOR', 'TEAM'] },
      { name: 'Pengaturan', href: '/settings', icon: '⚙️', allowedRoles: ['ADMIN'] },
    ]
  }
];

export function Sidebar({ role = 'TEAM' }: { role?: WorkspaceRole }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <span className="text-2xl mr-2">📋</span>
        <span className="text-xl font-bold">ContentPlanner</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pb-4">
        <nav className="flex-1 space-y-6 px-4 py-6">
          {navigation.map((category) => {
            const allowedItems = category.items.filter(item => item.allowedRoles.includes(role));
            
            if (allowedItems.length === 0) return null;

            return (
              <div key={category.title}>
                <h3 className="text-[10px] font-bold tracking-wider text-zinc-400 px-3 uppercase mb-2 mt-2">
                  {category.title}
                </h3>
                <div className="space-y-1">
                  {allowedItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          isActive
                            ? 'bg-zinc-900 text-white'
                            : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
                          'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                        )}
                      >
                        <span className="mr-3 text-lg" aria-hidden="true">
                          {item.icon}
                        </span>
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
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
