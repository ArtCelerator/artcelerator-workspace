'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatIDR } from '@/lib/utils';

type Tab = 'AGENSI' | 'KLIEN' | 'PROYEK' | 'BULAN' | 'TIM' | 'PERSONAL';

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('AGENSI');
  const [isEditor, setIsEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [agency, setAgency] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const agRes = await fetch('/api/analytics/agency');
      
      if (agRes.status === 403) {
        setIsEditor(true);
        setActiveTab('PERSONAL');
        const pRes = await fetch('/api/analytics/personal');
        if (pRes.ok) setPersonal(await pRes.json());
      } else {
        if (agRes.ok) setAgency(await agRes.json());
        const [cRes, pjRes, tRes, pRes] = await Promise.all([
          fetch('/api/analytics/clients'),
          fetch('/api/analytics/projects'),
          fetch('/api/analytics/team'),
          fetch('/api/analytics/personal')
        ]);
        if (cRes.ok) setClients(await cRes.json());
        if (pjRes.ok) setProjects(await pjRes.json());
        if (tRes.ok) setTeam(await tRes.json());
        if (pRes.ok) setPersonal(await pRes.json());
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const tabs: { id: Tab; label: string }[] = isEditor 
    ? [{ id: 'PERSONAL', label: 'Performa Saya' }]
    : [
        { id: 'AGENSI', label: 'Overview Agensi' },
        { id: 'KLIEN', label: 'Per Klien' },
        { id: 'PROYEK', label: 'Per Proyek' },
        { id: 'BULAN', label: 'Per Bulan' },
        { id: 'TIM', label: 'Per Team' },
        { id: 'PERSONAL', label: 'Performa Saya' }
      ];

  if (loading) return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full flex items-center justify-center">
      <div className="text-zinc-500 font-medium animate-pulse">Memuat analitik...</div>
    </div>
  );

  return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* 1. HEADER HALAMAN */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-blue-600 text-[10px] font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              METRIK PERFORMA & ANALISIS KONTEN
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl text-zinc-900 tracking-tight font-bold">
                📈 Performa & Analytics
              </h1>
            </div>
            <p className="text-sm text-zinc-500">
              Analisis performa data konten, jangkauan, interaksi, dan tren agensi Anda secara real-time.
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative inline-block">
              <button className="bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 flex items-center gap-2 transition-colors">
                <span className="material-symbols-outlined text-[18px] text-zinc-500">calendar_month</span>
                <span>Semua Waktu</span>
                <span className="material-symbols-outlined text-[16px] text-zinc-500">expand_more</span>
              </button>
            </div>
            <button className="bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 flex items-center gap-2 transition-colors group">
              <span className="material-symbols-outlined text-[18px] text-blue-700 group-hover:-translate-y-0.5 transition-transform">download</span>
              <span>Unduh Laporan</span>
            </button>
            <button className="bg-blue-500 text-white rounded-xl px-3.5 py-2 text-sm font-medium shadow-sm hover:bg-blue-600 transition-all flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">add_chart</span>
              <span className="hidden sm:inline">Kustomisasi Metrik</span>
            </button>
          </div>
        </section>

        {/* 2. NAVIGASI TABS ANALYTICS */}
        <nav className="border-b border-zinc-200 flex gap-6 text-sm overflow-x-auto pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 border-b-2 font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeTab === tab.id ? 'border-blue-700 text-zinc-900 font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
            >
              <span>{tab.label}</span>
              {tab.id === 'AGENSI' && <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-bold">LIVE</span>}
            </button>
          ))}
        </nav>

        {/* 3. KONTEN TAB: OVERVIEW AGENSI */}
        {activeTab === 'AGENSI' && agency && (
          <div className="space-y-6 animate-in fade-in">
            {/* BARIS 1 - KARTU METRIK UTAMA */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Total Engagement</span>
                    <div className="text-3xl font-bold text-zinc-900 tracking-tight">{agency.totalEngagement.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><span className="material-symbols-outlined text-[20px]">thumb_up</span></div>
                </div>
                <div className="mt-4 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">+{agency.growthPct}% ↑</span>
                  <span className="text-zinc-500 text-[11px] truncate">Bulan ke Bulan</span>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Total Reach</span>
                    <div className="text-3xl font-bold text-zinc-900 tracking-tight">{agency.totalReach.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><span className="material-symbols-outlined text-[20px]">group</span></div>
                </div>
                <div className="mt-4 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">+18% ↑</span>
                  <span className="text-zinc-500 text-[11px] truncate">Akumulasi Semua Klien</span>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Total Impressions</span>
                    <div className="text-3xl font-bold text-zinc-900 tracking-tight">{agency.totalImpressions.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700"><span className="material-symbols-outlined text-[20px]">visibility</span></div>
                </div>
                <div className="mt-4 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">+30% ↑</span>
                  <span className="text-zinc-500 text-[11px] truncate">Freq. rata-rata 2.7x</span>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Total Konten Tayang</span>
                      <span className="material-symbols-outlined text-[14px] text-orange-500">stars</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-700 tracking-tight">{agency.totalPublished}</div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><span className="material-symbols-outlined text-[20px]">article</span></div>
                </div>
                <div className="mt-4 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 text-[11px] truncate">Dalam Database</span>
                  <span className="font-semibold text-blue-600 text-[11px]">Aktif 100%</span>
                </div>
              </div>
            </section>

            {/* BARIS 2 - GRAFIK TREN UTAMA (Area Chart Recharts) */}
            <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-900">Tren Engagement Terakhir</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-50 border border-zinc-200 text-zinc-500">REAL-TIME</span>
                  </div>
                  <p className="text-sm text-zinc-500">Pertumbuhan interaksi dari waktu ke waktu berdasarkan data publish.</p>
                </div>
              </div>
              <div className="relative w-full h-[300px]">
                {agency.trend && agency.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={agency.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                      <XAxis dataKey="name" tick={{fontSize: 10, fill: '#71717a'}} tickLine={false} axisLine={false} />
                      <YAxis tick={{fontSize: 10, fill: '#71717a'}} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#18181b', fontWeight: 'bold' }}
                        formatter={(value: any) => [Number(value).toLocaleString('id-ID'), 'Engagement']}
                      />
                      <Area type="monotone" dataKey="engagement" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEngagement)" activeDot={{ r: 6, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm">Belum cukup data tren.</div>
                )}
              </div>
            </section>

            {/* BARIS 3 - 2 KOLOM Rincian */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Kolom Kiri: Engagement per Platform (Span 5) */}
              <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2"><span>📱 Distribusi Platform</span></h3>
                      <p className="text-sm text-zinc-500 mt-0.5">Jumlah konten yang dipublish per kanal</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-1">
                    {agency.platformCount && agency.platformCount.length > 0 ? agency.platformCount.map((p: any) => {
                      const total = agency.totalPublished || 1;
                      const percentage = Math.round((p.count / total) * 100);
                      const bgHeader = p.name === 'INSTAGRAM' ? 'bg-gradient-to-tr from-orange-500 to-blue-500' : p.name === 'TIKTOK' ? 'bg-slate-900' : 'bg-red-500';
                      const bgBar = p.name === 'INSTAGRAM' ? 'bg-gradient-to-r from-orange-500 to-blue-500' : p.name === 'TIKTOK' ? 'bg-slate-900' : 'bg-red-500';
                      return (
                        <div key={p.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded ${bgHeader} text-white flex items-center justify-center text-xs font-bold shadow-sm`}>{p.name.substring(0,2)}</div>
                              <span className="font-semibold text-zinc-900">{p.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-zinc-900">{p.count} Konten</span>
                              <span className="text-zinc-500 text-xs ml-1">({percentage}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                            <div className={`${bgBar} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    }) : (
                      <p className="text-sm text-zinc-500">Belum ada distribusi data.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: 5 Konten Performa Terbaik (Span 7) */}
              <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2"><span>🏆 Top Konten</span></h3>
                    <p className="text-sm text-zinc-500 mt-0.5">Urutan berdasarkan interaksi tertinggi</p>
                  </div>
                </div>
                <div className="divide-y divide-zinc-100 mt-2">
                  {agency.topContents && agency.topContents.length > 0 ? agency.topContents.map((c: any, index: number) => {
                    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                    const medal = medals[index] || `#${index+1}`;
                    return (
                      <div key={c.id} className="py-3 flex items-center justify-between gap-2 hover:bg-zinc-50 px-2 -mx-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg w-6 text-center font-bold">{medal}</span>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-zinc-900 truncate">{c.title}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600">{c.platform}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                              <span>Klien: <strong className="text-zinc-900 font-medium">{c.clientName}</strong></span>
                              <span>•</span>
                              <span>{c.publishedAt ? formatDateShort(c.publishedAt) : '-'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 text-right">
                          <div>
                            <div className="text-sm font-bold text-zinc-900">{c.engagement.toLocaleString('id-ID')}</div>
                            <div className="text-[11px] text-zinc-500">Engagement</div>
                          </div>
                        </div>
                      </div>
                    )
                  }) : (
                    <p className="text-sm text-zinc-500 py-4">Belum ada data konten terbaik.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 4. OTHER TABS (Simplified for non-Agensi views) */}
        {activeTab === 'KLIEN' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="p-4 bg-white border-b border-zinc-200">
                <h2 className="text-lg font-bold text-zinc-900">Performa Berdasarkan Klien</h2>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200 font-bold tracking-wider">
                  <tr><th className="px-4 py-3">Peringkat</th><th className="px-4 py-3">Nama Klien</th><th className="px-4 py-3 text-right">Total Engagement</th><th className="px-4 py-3 text-right">Reach</th><th className="px-4 py-3 text-center">Konten Publish</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {clients.map((c: any, i: number) => (
                    <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</td>
                      <td className="px-4 py-3 font-bold text-zinc-900">{c.name}</td>
                      <td className="px-4 py-3 text-blue-600 font-bold text-right">{c.engagement.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium text-right">{c.reach.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-center font-medium text-zinc-700">{c.contentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'PROYEK' && (
          <div className="grid md:grid-cols-2 gap-4 animate-in fade-in">
            {projects.map((p: any) => (
              <div key={p.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg text-zinc-900">{p.name}</h3><span className="text-[10px] font-bold tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">{p.status}</span></div>
                <p className="text-sm text-zinc-500 mb-4">{p.clientName}</p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <div><p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Total Engagement</p><p className="font-bold text-blue-600 text-lg mt-1">{p.engagement.toLocaleString('id-ID')}</p></div>
                  <div><p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Budget Terpakai</p><p className="font-bold text-red-600 mt-1">{formatIDR(p.spent)}</p><p className="text-xs text-zinc-400">dari {formatIDR(p.budget)}</p></div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
                  <div className="text-xs font-bold text-zinc-700">ROI: <span className="text-emerald-600">{p.roi}</span> eng/Rp</div>
                  <div className="text-xs font-medium text-zinc-500"><strong className="text-zinc-900">{p.publishedCount}</strong> / {p.totalContents} Konten Tayang</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'TIM' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="p-4 bg-white border-b border-zinc-200">
                <h2 className="text-lg font-bold text-zinc-900">Performa Berdasarkan Anggota Tim</h2>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200 font-bold tracking-wider">
                  <tr><th className="px-4 py-3">Peringkat</th><th className="px-4 py-3">Nama Anggota</th><th className="px-4 py-3 text-right">Rata-rata Engagement</th><th className="px-4 py-3 text-center">Total Konten</th><th className="px-4 py-3 text-center">On-Time Rate</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {team.map((t: any, i: number) => (
                    <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</td>
                      <td className="px-4 py-3 font-bold text-zinc-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">{t.name.charAt(0)}</div> {t.name}
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-bold text-right">{t.avgEngagement.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-center font-medium">{t.contentCount}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">{t.onTimeRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'PERSONAL' && personal && (
          <div className="space-y-6 animate-in fade-in">
             <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 transition-all">
                <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-1">Total Ditugaskan</div>
                <div className="text-3xl font-bold text-zinc-900 tracking-tight">{personal.totalContents}</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 transition-all">
                <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-1">Berhasil Dipublish</div>
                <div className="text-3xl font-bold text-blue-600 tracking-tight">{personal.publishedCount}</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 transition-all">
                <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-1">Avg Engagement</div>
                <div className="text-3xl font-bold text-blue-700 tracking-tight">{personal.avgEngagement.toLocaleString('id-ID')}</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 transition-all">
                <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-1">On-Time Rate</div>
                <div className="text-3xl font-bold text-emerald-600 tracking-tight">95%</div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'BULAN' && (
           <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center shadow-sm animate-in fade-in">
             <div className="text-4xl mb-4">📅</div>
             <h2 className="text-lg font-bold text-zinc-900 mb-2">Laporan Bulanan</h2>
             <p className="text-sm text-zinc-500">Tampilan analisis tren komparatif bulanan sedang dalam pengembangan.</p>
           </div>
        )}

      </div>
    </div>
  );
}

function formatDateShort(dateString: string) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
