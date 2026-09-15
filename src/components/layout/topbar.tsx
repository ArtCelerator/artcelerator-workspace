'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';

import { NotificationBell } from '@/components/notifications/notification-bell';

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  workspaceName?: string;
}

export function Topbar({ user, workspaceName }: TopbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 relative z-[50]">
      <div className="flex items-center">
        <span className="text-sm font-medium text-zinc-500 mr-2">Workspace:</span>
        <span className="text-sm font-bold text-zinc-900">{workspaceName || 'Memuat...'}</span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification Bell Component */}
        <NotificationBell />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="flex items-center rounded-full bg-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
            id="user-menu-button"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="sr-only">Buka menu pengguna</span>
            <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium">
              {initials}
            </div>
          </button>

          {isDropdownOpen && (
            <div
              className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
              tabIndex={-1}
            >
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium text-zinc-900 truncate">{user.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-100"
                role="menuitem"
                tabIndex={-1}
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
