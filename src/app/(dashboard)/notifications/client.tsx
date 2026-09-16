'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' });
      if (res.ok) {
        toast.success('Semua notifikasi ditandai dibaca');
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      }
    } catch (e) {
      toast.error('Gagal menandai dibaca');
    }
  };

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (e) {}
  };

  // derived metrics
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentCount = notifications.filter(n => !n.isRead && n.priority === 'URGENT').length;
  const reviewCount = notifications.filter(n => !n.isRead && n.type === 'CONTENT_SUBMITTED').length; // approximation for review
  const infoCount = notifications.filter(n => !n.isRead && n.priority !== 'URGENT' && n.type !== 'CONTENT_SUBMITTED').length;
  
  // For the chart
  const activeNotifs = Math.max(1, unreadCount); // avoid div by zero
  const pctUrgent = (urgentCount / activeNotifs) * 100;
  const pctReview = (reviewCount / activeNotifs) * 100;
  // const pctInfo = (infoCount / activeNotifs) * 100; // remaining

  // Filter Logic
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'urgent') return n.priority === 'URGENT';
    
    const isKonten = n.type.startsWith('CONTENT_');
    const isKeuangan = n.type.startsWith('INVOICE_') || n.type.startsWith('PAYMENT_');
    const isSistem = !isKonten && !isKeuangan;

    if (activeFilter === 'konten') return isKonten;
    if (activeFilter === 'keuangan') return isKeuangan;
    if (activeFilter === 'sistem') return isSistem;
    
    return true;
  });

  const getCategoryTheme = (n: any) => {
    const isKonten = n.type.startsWith('CONTENT_');
    const isKeuangan = n.type.startsWith('INVOICE_') || n.type.startsWith('PAYMENT_');

    if (n.priority === 'URGENT') return { bg: 'bg-red-50', text: 'text-red-700', icon: 'warning', dot: 'bg-red-600', ring: 'ring-red-100', dotBg: 'bg-red-600' };
    if (n.priority === 'IMPORTANT') return { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'rate_review', dot: 'bg-amber-600', ring: 'ring-amber-50', dotBg: 'bg-amber-500' };
    if (isKeuangan) return { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'account_balance_wallet', dot: 'bg-blue-600', ring: 'ring-blue-100', dotBg: 'bg-blue-600' };
    if (isKonten) return { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'task_alt', dot: 'bg-indigo-600', ring: 'ring-indigo-100', dotBg: 'bg-indigo-500' };
    
    return { bg: 'bg-zinc-100', text: 'text-zinc-700', icon: 'info', dot: 'bg-zinc-400', ring: 'ring-zinc-100', dotBg: 'bg-zinc-400' };
  };

  const getRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (m < 60) return `${m} menit lalu`;
    if (h < 24) return `${h} jam lalu`;
    return `${days} hari lalu`;
  };

  if (loading) return <div className="pt-16 min-h-screen bg-zinc-50 flex justify-center"><div className="animate-pulse pt-10 text-zinc-500">Memuat...</div></div>;

  return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full">
      <div className="flex flex-col w-full">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* TOP SUMMARY BANNER */}
          <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-amber-500 text-[28px]">notifications_active</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] text-amber-500 tracking-wider uppercase font-bold">Sistem Komunikasi & Aktivitas</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="font-mono text-xs text-zinc-400">v2.4 Activity Stream</span>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">Stream Pembaruan Real-Time Workspace</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-xs text-white font-medium">Syncing: Aktif</span>
              </div>
              <button onClick={handleMarkAllRead} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                <span className="font-semibold">Tandai Semua Dibaca</span>
              </button>
            </div>
          </div>

          {/* MAIN HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔔</span>
                <h2 className="text-3xl text-zinc-900 tracking-tight font-bold">Pusat Notifikasi</h2>
              </div>
              <p className="text-sm text-zinc-500 mt-1">Riwayat seluruh pemberitahuan tugas, persetujuan konten, tagihan, dan peringatan sistem.</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button className="bg-white hover:bg-zinc-50 text-zinc-900 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm border border-zinc-200 transition-colors">
                <span className="material-symbols-outlined text-[18px] text-zinc-500">tune</span>
                Semua Klien
                <span className="material-symbols-outlined text-[16px] text-zinc-500">expand_more</span>
              </button>
              <button className="bg-white hover:bg-zinc-50 text-zinc-500 p-2.5 rounded-xl shadow-sm border border-zinc-200 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
            </div>
          </div>

          {/* TAB FILTER RIBBON */}
          <div className="bg-white rounded-xl p-1.5 shadow-sm border border-zinc-200 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max">
              {[
                { id: 'all', label: 'Semua', count: notifications.length },
                { id: 'unread', label: 'Belum Dibaca', count: unreadCount, badge: true },
                { id: 'urgent', label: 'Urgent', count: notifications.filter(n => n.priority === 'URGENT').length, dot: true },
                { id: 'konten', label: 'Konten', icon: 'edit_document' },
                { id: 'keuangan', label: 'Keuangan', icon: 'payments' },
                { id: 'sistem', label: 'Sistem', icon: 'dns' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${activeFilter === f.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 font-medium'}`}
                >
                  {f.dot && <span className="w-2 h-2 rounded-full bg-red-600"></span>}
                  {f.icon && <span className="material-symbols-outlined text-[16px]">{f.icon}</span>}
                  <span>{f.label}</span>
                  {f.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.badge ? 'bg-blue-600 text-white' : activeFilter === f.id ? 'bg-blue-200/50 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="hidden lg:flex items-center gap-2 pr-2 flex-shrink-0 text-zinc-500 text-xs">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Urutkan: <strong className="text-zinc-900 font-medium">Terbaru</strong></span>
            </div>
          </div>

          {/* 2-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT STREAM */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-[24px] shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
                <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-base text-zinc-900 font-semibold">Aktivitas Terbaru</span>
                    {unreadCount > 0 && <span className="text-[10px] uppercase bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{unreadCount} Belum Dibaca</span>}
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">Auto-refresh: 30s</span>
                </div>
                
                <div className="flex flex-col bg-zinc-50/50 divide-y divide-zinc-100">
                  {filteredNotifications.map(n => {
                    const theme = getCategoryTheme(n);
                    return (
                      <div key={n.id} onClick={(e) => { if (!n.isRead) handleMarkRead(n.id, e); }} className={`relative bg-white p-6 hover:bg-zinc-50 transition-colors flex flex-col gap-3 cursor-pointer ${n.isRead ? 'opacity-70' : ''}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center pt-1">
                              {!n.isRead ? <span className={`w-2.5 h-2.5 rounded-full ${theme.dotBg} ring-4 ${theme.ring}`}></span> : <span className="w-2.5 h-2.5 rounded-full bg-zinc-200"></span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl ${theme.bg} ${theme.text} flex items-center justify-center flex-shrink-0`}>
                                <span className="material-symbols-outlined text-[20px]">{theme.icon}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-base font-semibold ${n.isRead ? 'text-zinc-600' : 'text-zinc-900'}`}>{n.title}</span>
                                {!n.isRead && n.priority === 'URGENT' && <span className="bg-red-600 text-white text-[10px] uppercase px-2 py-0.5 rounded font-bold tracking-wider">Urgent Action</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-500 text-xs flex-shrink-0">
                            <span className="material-symbols-outlined text-[14px]">history</span>
                            <span>{getRelativeTime(n.createdAt)}</span>
                          </div>
                        </div>
                        
                        <div className="pl-11">
                          <p className={`text-sm leading-relaxed ${n.isRead ? 'text-zinc-500' : 'text-zinc-700'}`}>
                            {n.message}
                          </p>
                          
                          <div className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-50">
                            <div className="flex flex-wrap items-center gap-2 text-zinc-500 text-xs">
                              <span className="font-medium text-zinc-900">Type:</span> {n.type}
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              {n.link && (
                                <a href={n.link} className="bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 text-sm px-3 py-1.5 rounded-lg transition-colors font-medium">
                                  Lihat Detail
                                </a>
                              )}
                              {!n.isRead && (
                                <button onClick={(e) => handleMarkRead(n.id, e)} className="text-blue-600 hover:text-blue-700 text-xs font-semibold px-2 py-1 transition-colors">
                                  Tandai Selesai
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredNotifications.length === 0 && (
                    <div className="p-10 text-center text-zinc-500 text-sm">Tidak ada notifikasi yang ditemukan.</div>
                  )}
                </div>
                
                <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                  <div>
                    Menampilkan <span className="font-semibold text-zinc-900">{filteredNotifications.length}</span> dari <span className="font-semibold text-zinc-900">{notifications.length}</span> notifikasi
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-400 cursor-not-allowed font-medium flex items-center gap-1 shadow-sm" disabled>
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span> Sebelumnya
                    </button>
                    <div className="flex items-center gap-1">
                      <button className="w-8 h-8 rounded-lg bg-zinc-900 text-white font-semibold flex items-center justify-center shadow-sm">1</button>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium flex items-center gap-1 transition-colors shadow-sm">
                      Selanjutnya <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* RADAR CARD */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Distribusi Belum Dibaca</span>
                  <span className="material-symbols-outlined text-zinc-400 text-[18px]">pie_chart</span>
                </div>
                
                <div className="flex items-center gap-6 py-2">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#f4f4f5" strokeWidth="3"></circle>
                      <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#dc2626" strokeDasharray={`${pctUrgent || 0} ${100 - (pctUrgent || 0)}`} strokeDashoffset="0" strokeWidth="3.5"></circle>
                      <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#d97706" strokeDasharray={`${pctReview || 0} ${100 - (pctReview || 0)}`} strokeDashoffset={`-${pctUrgent || 0}`} strokeWidth="3.5"></circle>
                      <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#2563eb" strokeDasharray={`${100 - (pctUrgent || 0) - (pctReview || 0)} ${pctUrgent + pctReview}`} strokeDashoffset={`-${(pctUrgent || 0) + (pctReview || 0)}`} strokeWidth="3.5"></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-bold text-zinc-900">{unreadCount}</span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Unread</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                        <span className="text-zinc-600 font-medium">Urgent Action</span>
                      </div>
                      <span className="font-mono font-semibold text-zinc-900">{urgentCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                        <span className="text-zinc-600 font-medium">Review / Appr</span>
                      </div>
                      <span className="font-mono font-semibold text-zinc-900">{reviewCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span className="text-zinc-600 font-medium">Info Umum</span>
                      </div>
                      <span className="font-mono font-semibold text-zinc-900">{infoCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHANNELS */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base text-zinc-900 font-semibold">Saluran Notifikasi</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Integrasi pengiriman pesan langsung</p>
                  </div>
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">hub</span>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">send</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">Telegram Bot Alert</div>
                        <div className="font-mono text-zinc-500 text-[11px]">@ArtceleratorBot</div>
                      </div>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Aktif</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">notifications</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">In-App Push</div>
                        <div className="text-xs text-zinc-500">Desktop & Mobile Web</div>
                      </div>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Aktif</span>
                  </div>
                </div>
                
                <a href="/settings" className="w-full mt-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 py-2 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <span>Kelola Preferensi & Frekuensi</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                </a>
              </div>

              {/* TIPS */}
              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 space-y-2">
                <div className="flex items-center gap-1.5 text-blue-700">
                  <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tips Operasional</span>
                </div>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  Klik notifikasi untuk menandainya langsung telah selesai ditindaklanjuti, atau tekan tombol Tandai Selesai.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
