'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter((n: any) => !n.isRead);
        
        // Check for new urgent ones
        const oldUnreadIds = new Set(notifications.filter(n => !n.isRead).map(n => n.id));
        unread.forEach((n: any) => {
          if (n.priority === 'URGENT' && !oldUnreadIds.has(n.id)) {
            toast.error(`🚨 ${n.title}`, { description: n.message });
          }
        });

        setNotifications(data);
        setUnreadCount(unread.length);
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // Poll 30s
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-zinc-100 relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 shadow-xl rounded-md z-50 flex flex-col max-h-96">
          <div className="p-3 border-b border-zinc-100 flex justify-between items-center shrink-0">
            <span className="font-bold">Notifikasi</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Tandai semua dibaca</button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">Tidak ada notifikasi</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {notifications.map(n => (
                  <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-3 hover:bg-zinc-50 cursor-pointer ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex gap-2 items-start">
                      <span className="shrink-0 mt-0.5">
                        {n.priority === 'URGENT' ? '🚨' : n.priority === 'IMPORTANT' ? '⚠️' : '🔔'}
                      </span>
                      <div className="flex-1 min-w-0">
                        {n.link ? (
                          <Link href={n.link} className="font-semibold text-sm block truncate hover:underline" onClick={() => setIsOpen(false)}>{n.title}</Link>
                        ) : (
                          <span className="font-semibold text-sm block truncate">{n.title}</span>
                        )}
                        <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-zinc-400 mt-1 block">{new Date(n.createdAt).toLocaleString('id-ID')}</span>
                      </div>
                      {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-zinc-100 shrink-0 text-center">
            <Link href="/notifications" onClick={() => setIsOpen(false)} className="text-xs text-blue-600 hover:text-blue-700 block py-1 font-medium">
              Lihat Semua Notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
