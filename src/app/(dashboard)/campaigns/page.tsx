'use client';

import { useState, useEffect } from 'react';
import { formatIDR } from '@/lib/utils';
import Link from 'next/link';

type Campaign = {
  id: string;
  name: string;
  clientName: string;
  startDate: string;
  endDate: string;
  status: string;
  goal: string | null;
  budget: number | null;
  color: string;
  progress: number;
  publishedContents: number;
  totalContents: number;
  totalEngagement: number;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('Semua Klien');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('/api/campaigns');
        if (res.ok) {
          setCampaigns(await res.json());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { bgHeader: 'bg-blue-600', badge: 'bg-blue-50 text-blue-700', text: 'AKTIF', dot: 'bg-blue-600', bar: 'bg-slate-900', isPulse: true };
      case 'PLANNING': return { bgHeader: 'bg-orange-500', badge: 'bg-slate-100 text-slate-500', text: 'PERENCANAAN', dot: 'bg-slate-500', bar: 'bg-slate-300', isPulse: false };
      case 'COMPLETED': return { bgHeader: 'bg-emerald-600', badge: 'bg-blue-50 text-blue-600', text: 'SELESAI', dot: '', icon: 'check_circle', bar: 'bg-blue-600', isPulse: false };
      case 'ON_HOLD': return { bgHeader: 'bg-red-600', badge: 'bg-red-50 text-red-600', text: 'PAUSE', dot: 'bg-red-600', bar: 'bg-orange-500', isPulse: false };
      case 'CANCELLED': return { bgHeader: 'bg-slate-500', badge: 'bg-orange-50 text-orange-500', text: 'DIBATALKAN', dot: 'bg-orange-500', bar: 'bg-red-500', isPulse: false };
      default: return { bgHeader: 'bg-blue-600', badge: 'bg-blue-50 text-blue-700', text: status, dot: 'bg-blue-600', bar: 'bg-slate-900', isPulse: false };
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.clientName.toLowerCase().includes(search.toLowerCase());
    const matchClient = clientFilter === 'Semua Klien' || c.clientName === clientFilter;
    const matchStatus = statusFilter === 'Semua Status' || 
                        (statusFilter === 'Aktif' && c.status === 'ACTIVE') ||
                        (statusFilter === 'Perencanaan' && c.status === 'PLANNING') ||
                        (statusFilter === 'On Hold/Pause' && c.status === 'ON_HOLD') ||
                        (statusFilter === 'Selesai' && c.status === 'COMPLETED') ||
                        (statusFilter === 'Dibatalkan' && c.status === 'CANCELLED');
    return matchSearch && matchClient && matchStatus;
  });

  const uniqueClients = ['Semua Klien', ...Array.from(new Set(campaigns.map(c => c.clientName).filter(n => n !== '-')))];
  
  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length;
  const planningCount = campaigns.filter(c => c.status === 'PLANNING' || c.status === 'COMPLETED').length;
  const totalBudget = campaigns.reduce((acc, c) => acc + (Number(c.budget) || 0), 0);
  
  // Find closest deadline
  const upcomingCampaigns = campaigns.filter(c => c.status === 'ACTIVE' && new Date(c.endDate) >= new Date()).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  const closestDeadline = upcomingCampaigns.length > 0 ? upcomingCampaigns[0] : null;
  const daysLeft = closestDeadline ? Math.ceil((new Date(closestDeadline.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

  if (loading) return (
    <div className="pt-6 min-h-screen bg-zinc-50 w-full flex items-center justify-center">
      <div className="text-zinc-500 font-medium animate-pulse">Memuat kampanye...</div>
    </div>
  );

  return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full">
      <div className="flex flex-col w-full p-6 lg:p-8 max-w-7xl mx-auto">
        
        {/* Top Breadcrumb / Super-header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col">
            <span className="font-bold text-[10px] text-blue-600 tracking-wider uppercase bg-blue-50 px-2.5 py-1 rounded-full self-start mb-2">
              MANAJEMEN KAMPANYE & MARKETING
            </span>
            <h1 className="text-3xl text-zinc-900 tracking-tight flex items-center gap-2 font-bold">
              <span>🎯</span> Kampanye Marketing
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Kelola kampanye pemasaran khusus, target pencapaian, dan progres eksekusinya.
            </p>
          </div>
          {/* Header Actions */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button className="flex items-center gap-1.5 bg-white text-zinc-900 border border-zinc-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-50 shadow-sm transition-all">
              <span className="material-symbols-outlined text-[18px] text-zinc-500">calendar_month</span>
              <span>Kalender Kampanye</span>
            </button>
            <button className="flex items-center gap-1.5 bg-zinc-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-800 shadow-sm transition-all">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Buat Kampanye</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* KPI 1 */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col justify-between border border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Kampanye Aktif</span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">ads_click</span>
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl text-zinc-900 block leading-none font-bold">{activeCount} Kampanye</span>
              <span className="text-sm text-zinc-500 mt-1 block">{planningCount} Perencanaan / Selesai</span>
            </div>
          </div>
          {/* KPI 2 */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col justify-between border border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Budget Kampanye</span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl text-zinc-900 block leading-none font-bold">{formatIDR(totalBudget)}</span>
              <span className="text-sm text-zinc-500 mt-1 block">Akumulasi Semua Kampanye</span>
            </div>
          </div>
          {/* KPI 3 */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col justify-between border border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rata-rata Konversi Goal</span>
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl text-zinc-900 leading-none font-bold">71.4%</span>
                <span className="text-[10px] font-bold text-zinc-500 tracking-wider">+12.8% vs Q2</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '71.4%' }}></div>
              </div>
            </div>
          </div>
          {/* KPI 4 */}
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Deadline Kampanye Terdekat</span>
              <span className="w-8 h-8 rounded-lg bg-white/10 text-orange-200 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">alarm</span>
              </span>
            </div>
            <div className="mt-3">
              {closestDeadline ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-white leading-none font-bold">{formatDateShort(closestDeadline.endDate)}</span>
                    <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">{daysLeft} HARI LAGI</span>
                  </div>
                  <span className="text-sm text-slate-300 mt-1 block truncate">{closestDeadline.name} • {closestDeadline.clientName}</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-white leading-none font-bold">-</span>
                  </div>
                  <span className="text-sm text-slate-300 mt-1 block truncate">Tidak ada deadline aktif</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filter & View Control Bar */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-zinc-200 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px] pointer-events-none">search</span>
              <input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-sm transition-all" 
                placeholder="Cari kampanye..." type="text"
              />
            </div>
            <div className="relative">
              <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="h-9 px-3 pr-8 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 appearance-none focus:outline-none cursor-pointer">
                {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-[16px] pointer-events-none">expand_more</span>
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 pr-8 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 appearance-none focus:outline-none cursor-pointer">
                <option>Semua Status</option>
                <option>Aktif</option>
                <option>Perencanaan</option>
                <option>On Hold/Pause</option>
                <option>Selesai</option>
                <option>Dibatalkan</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-[16px] pointer-events-none">expand_more</span>
            </div>
            <button onClick={() => { setSearch(''); setClientFilter('Semua Klien'); setStatusFilter('Semua Status'); }} className="text-xs text-blue-600 hover:underline font-semibold ml-1" type="button">
              Reset Filter
            </button>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 self-end xl:self-auto w-full xl:w-auto">
            <span className="text-sm text-zinc-500">Menampilkan <strong>{filteredCampaigns.length}</strong> Kampanye</span>
            <div className="inline-flex bg-zinc-50 p-1 rounded-xl border border-zinc-200">
              <button className="px-2.5 py-1 rounded-lg bg-white shadow-sm text-zinc-900 text-xs font-medium flex items-center gap-1.5 border border-zinc-200">
                <span className="material-symbols-outlined text-[16px]">grid_view</span> Grid
              </button>
              <button className="px-2.5 py-1 rounded-lg text-zinc-500 hover:text-zinc-900 text-xs font-medium flex items-center gap-1.5 transition-colors">
                <span className="material-symbols-outlined text-[16px]">view_list</span> Tabel
              </button>
            </div>
          </div>
        </div>

        {/* Campaigns Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.length > 0 ? filteredCampaigns.map((camp) => {
            const statusUi = getStatusColor(camp.status);
            return (
              <div key={camp.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group border border-zinc-200">
                <div className={`h-2 ${statusUi.bgHeader}`}></div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`${statusUi.badge} text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-bold tracking-wider`}>
                        {statusUi.icon ? (
                           <span className="material-symbols-outlined text-[14px]">{statusUi.icon}</span>
                        ) : (
                           <span className={`w-1.5 h-1.5 rounded-full ${statusUi.dot} ${statusUi.isPulse ? 'animate-pulse' : ''}`}></span>
                        )}
                        {statusUi.text}
                      </span>
                      <button className="text-zinc-400 hover:text-zinc-900 p-1 rounded transition-colors" type="button">
                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                      </button>
                    </div>
                    <h3 className="text-lg text-zinc-900 group-hover:text-blue-600 transition-colors mt-3 font-semibold truncate">
                      {camp.name}
                    </h3>
                    <div className="mt-1 mb-3">
                      <p className="text-sm text-zinc-500 font-medium flex items-center gap-1.5 truncate">
                        {camp.clientName}
                      </p>
                      <span className="text-[11px] font-mono text-zinc-500 block mt-0.5">📅 {formatDateShort(camp.startDate)} – {formatDateShort(camp.endDate)}</span>
                    </div>
                    {/* Goal Box */}
                    <div className="bg-zinc-50 rounded-lg p-2.5 my-3 text-[12px] text-zinc-800 leading-relaxed border border-zinc-200 line-clamp-3">
                      <strong className="font-semibold text-zinc-900">🎯 Goal:</strong> {camp.goal || 'Belum ada target spesifik'}
                    </div>
                    {/* Progress Deliverable */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-zinc-900">
                        <span>Progres Konten Kampanye</span>
                        <span className="font-mono text-blue-600">{camp.progress}%</span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div className={`h-full ${statusUi.bar} rounded-full transition-all duration-300`} style={{ width: `${camp.progress}%` }}></div>
                      </div>
                      <p className="text-sm text-zinc-500 text-[11px]">{camp.publishedContents} dari {camp.totalContents} konten tayang</p>
                    </div>
                  </div>
                  {/* Card Footer */}
                  <div className="border-t border-zinc-100 pt-3 mt-4 flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-zinc-500 text-[11px]">💰 Budget: <strong className="text-zinc-900 font-semibold font-mono">{formatIDR(camp.budget || 0)}</strong></span>
                      <span className="text-zinc-500 text-[11px]">📈 Eng: <strong className="text-zinc-900 font-semibold">{camp.totalEngagement.toLocaleString('id-ID')} Total</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/campaigns/${camp.id}`} className="text-blue-600 font-medium hover:underline flex items-center gap-0.5">
                        Detail <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-16 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">campaign</span>
              <p className="text-zinc-500 font-medium">Tidak ada kampanye yang ditemukan.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function formatDateShort(dateString: string) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
