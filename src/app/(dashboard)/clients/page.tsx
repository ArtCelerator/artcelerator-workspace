'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { formatIDR } from '@/lib/utils';
import Link from 'next/link';
import { DndContext, DragEndEvent, closestCorners, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const CLIENT_STATUSES = [
  { id: 'LEAD', label: '🎯 LEAD', color: 'bg-zinc-200 text-zinc-700' },
  { id: 'PROSPECT', label: '💬 PROSPEK', color: 'bg-blue-100 text-blue-700' },
  { id: 'ACTIVE', label: '✅ AKTIF', color: 'bg-slate-900 text-white' },
  { id: 'PAUSED', label: '⏸️ PAUSE', color: 'bg-orange-100 text-orange-600' },
  { id: 'CHURNED', label: '🔴 CHURNED', color: 'bg-red-100 text-red-700' }
];

function formatShortAmount(amount: number) {
  if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1).replace('.0', '')}jt`;
  if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}k`;
  return formatIDR(amount);
}

const formSchema = z.object({
  name: z.string().min(2, "Minimal 2 karakter"),
  industry: z.string().optional(),
  status: z.enum(['LEAD', 'PROSPECT', 'ACTIVE', 'PAUSED', 'CHURNED']),
  monthlyRetainer: z.coerce.number().optional(),
});
type FormData = z.infer<typeof formSchema>;

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'PIPELINE' | 'LIST'>('PIPELINE');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', industry: '', status: 'LEAD', monthlyRetainer: 0 }
  });

  const fetchClients = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const res = await fetch(`/api/clients?${params.toString()}`);
    if (res.ok) setClients(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, [search]);

  const onSubmit = async (data: any) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      toast.success('Klien ditambahkan');
      setIsFormOpen(false);
      reset();
      fetchClients();
    } catch {
      toast.error('Gagal menambahkan klien');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const clientId = active.id as string;
    const newStatus = over.id as string;
    const client = clients.find(c => c.id === clientId);
    if (!client || client.status === newStatus) return;

    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: newStatus } : c));
    try {
      await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch {
      toast.error('Gagal mengupdate status');
      fetchClients();
    }
  };

  const filteredClients = useMemo(() => {
    if (statusFilter === 'ALL') return clients;
    return clients.filter(c => c.status === statusFilter);
  }, [clients, statusFilter]);

  // Metrics
  const activeClients = clients.filter(c => c.status === 'ACTIVE');
  const activeMRR = activeClients.reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0);
  
  const pipelineClients = clients.filter(c => c.status === 'LEAD' || c.status === 'PROSPECT');
  const pipelineValue = pipelineClients.reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0);

  const avgACV = activeClients.length > 0 ? activeMRR / activeClients.length : 0;

  return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full">
      <div className="px-6 space-y-6 max-w-[1720px] mx-auto w-full pb-10">
        
        {/* 1. HEADER HALAMAN */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              CRM & Revenue Pipeline
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl text-zinc-900 tracking-tight font-bold">👥 Klien (CRM)</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200 text-zinc-600 rounded-md uppercase">{clients.length} Rekanan</span>
            </div>
            <p className="text-sm text-zinc-500">
              Kelola seluruh data klien, portofolio retainer aktif, dan proyeksi arus kas pipeline agensi secara terpadu.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-zinc-200 p-1 rounded-xl shadow-inner">
              <button 
                onClick={() => setView('PIPELINE')} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'PIPELINE' ? 'bg-slate-900 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`} 
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">view_kanban</span>
                <span>Pipeline</span>
              </button>
              <button 
                onClick={() => setView('LIST')} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'LIST' ? 'bg-slate-900 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`} 
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">table_rows</span>
                <span>Tabel List</span>
              </button>
            </div>
            
            <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-900 rounded-xl text-sm font-medium shadow-sm border border-zinc-200 transition-all" type="button">
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Ekspor CSV</span>
            </button>
            <button 
              onClick={() => setIsFormOpen(true)} 
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95" 
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Tambah Klien</span>
            </button>
          </div>
        </header>

        {/* 2. STATISTIK KLIEN & REVENUE SUMMARY */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Total Klien Aktif</span>
              <span className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl text-zinc-900 font-bold tracking-tight">{activeClients.length} Klien</span>
            </div>
            <div className="mt-3 pt-3 bg-zinc-50 -mx-4 -mb-4 px-4 py-2 flex items-center justify-between border-t border-zinc-100">
              <span className="text-xs text-zinc-500 font-medium">Total Realisasi MRR:</span>
              <span className="font-mono text-sm text-zinc-900 font-semibold">{formatIDR(activeMRR)}<span className="text-zinc-500 font-normal text-xs">/bln</span></span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Potensi Pipeline</span>
              <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">insights</span>
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl text-zinc-900 font-bold tracking-tight">{pipelineClients.length} Prospek</span>
            </div>
            <div className="mt-3 pt-3 bg-zinc-50 -mx-4 -mb-4 px-4 py-2 flex items-center justify-between border-t border-zinc-100">
              <span className="text-xs text-zinc-500 font-medium">Estimasi Value:</span>
              <span className="font-mono text-sm text-blue-600 font-semibold">{formatIDR(pipelineValue)}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Rata-rata Retainer</span>
              <span className="p-1.5 bg-zinc-100 text-zinc-700 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl text-zinc-900 font-bold tracking-tight">{formatShortAmount(avgACV)}</span>
              <span className="text-xs text-zinc-500">/ klien</span>
            </div>
            <div className="mt-3 pt-3 bg-zinc-50 -mx-4 -mb-4 px-4 py-2 flex items-center justify-between border-t border-zinc-100">
              <span className="text-xs text-zinc-500 font-medium">Status Kesehatan:</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">Stabil</span>
            </div>
          </div>
          
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md relative overflow-hidden">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Client Retention</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                Sehat 🟢
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-white">92.4%</span>
              <span className="text-[10px] font-bold text-slate-400">LTV ~14.2 bln</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '92.4%' }}></div>
              </div>
              <span className="font-mono text-[10px] text-slate-400">Target: 90%</span>
            </div>
          </div>
        </section>

        {/* 3. FILTER BAR CARD */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[260px] flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400">search</span>
                <input 
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                  placeholder="Cari nama klien, PIC, atau brand..." 
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="relative">
                <select 
                  className="h-9 px-3 pr-8 rounded-lg bg-zinc-50 border border-zinc-200 text-sm font-medium text-zinc-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Semua Status</option>
                  {CLIENT_STATUSES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400 pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500 self-end lg:self-center">
              <span className="material-symbols-outlined text-[16px]">folder_shared</span>
              <span className="font-mono text-zinc-900 font-bold">{filteredClients.length}</span>
              <span className="text-xs font-medium">Hasil Filter</span>
            </div>
          </div>
        </section>

        {/* 4. CONTENT VIEW */}
        {view === 'PIPELINE' ? (
          <section className="w-full overflow-x-auto pb-4">
            <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="flex items-start gap-4 min-w-max pb-2">
                {CLIENT_STATUSES.map(statusObj => (
                  <ClientKanbanColumn 
                    key={statusObj.id} 
                    statusObj={statusObj} 
                    clients={filteredClients.filter(c => c.status === statusObj.id)} 
                  />
                ))}
              </div>
            </DndContext>
          </section>
        ) : (
          <section className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 bg-zinc-50 flex items-center justify-between border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-slate-700">table_chart</span>
                <h2 className="text-sm font-bold text-zinc-900">Tabel List Klien</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Klien & Brand</th>
                    <th className="py-3 px-4">Industri</th>
                    <th className="py-3 px-4">Status Pipeline</th>
                    <th className="py-3 px-4">Aktivitas</th>
                    <th className="py-3 px-4">Nilai Retainer</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm text-zinc-900">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-zinc-500">Memuat data...</td></tr>
                  ) : filteredClients.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-zinc-500">Tidak ada klien ditemukan.</td></tr>
                  ) : filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">{client.name}</span>
                          <span className="font-mono text-[10px] text-zinc-500">ID: {client.id.substring(0, 8)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded bg-zinc-100 text-xs font-medium text-zinc-600">{client.industry || '-'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${CLIENT_STATUSES.find(s=>s.id === client.status)?.color}`}>
                          {CLIENT_STATUSES.find(s=>s.id === client.status)?.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 text-xs">
                        <span className="font-medium text-zinc-700">{client._count?.projects || 0}</span> Proyek • <span className="font-medium text-zinc-700">{client._count?.contents || 0}</span> Konten
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                        {formatIDR(client.monthlyRetainer || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/clients/${client.id}`}>
                          <button className="px-3 py-1.5 bg-white border border-zinc-200 hover:bg-slate-900 hover:text-white rounded-lg text-xs font-semibold transition-colors shadow-sm" type="button">
                            Detail ↗
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>

      {/* MODAL DIALOG: TAMBAH KLIEN CEPAT */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-300">domain_add</span>
                <h3 className="text-lg font-bold text-white">Tambah Rekanan Klien Baru</h3>
              </div>
              <button className="p-1 rounded text-slate-400 hover:text-white transition-colors" onClick={() => setIsFormOpen(false)} type="button">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Nama Brand / Perusahaan</label>
                <input 
                  {...register('name')}
                  className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner" 
                  placeholder="mis. PT Citra Kreasi Digital" 
                  type="text"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Industri</label>
                  <select 
                    {...register('industry')}
                    className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="">Pilih Industri</option>
                    <option value="Kecantikan & Skincare">Kecantikan & Skincare</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Teknologi & Gaming">Teknologi & Gaming</option>
                    <option value="Otomotif">Otomotif</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Tahap Pipeline Awal</label>
                  <select 
                    {...register('status')}
                    className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    {CLIENT_STATUSES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Estimasi Retainer / Bulan</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-400">Rp</span>
                    <input 
                      {...register('monthlyRetainer')}
                      className="w-full h-10 pl-9 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                      placeholder="8000000" 
                      type="number"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button 
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors" 
                  onClick={() => setIsFormOpen(false)} 
                  type="button"
                >
                  Batalkan
                </button>
                <button 
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-all active:scale-95" 
                  type="submit"
                >
                  Simpan Klien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function ClientKanbanColumn({ statusObj, clients }: { statusObj: any, clients: any[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: statusObj.id });
  
  const totalValue = clients.reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0);

  return (
    <div className={`w-[300px] shrink-0 bg-zinc-100 rounded-xl p-2 flex flex-col gap-2 border border-zinc-200 h-[calc(100vh-280px)] transition-colors ${isOver ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''}`}>
       <div className="flex items-center justify-between px-1.5 py-1">
         <div className="flex items-center gap-1.5">
           <span className="text-[13px] font-bold text-zinc-800">{statusObj.label}</span>
           <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${statusObj.color}`}>{clients.length}</span>
         </div>
         <div className="flex items-center gap-1">
           <span className="font-mono text-[10px] text-zinc-500 font-bold mr-1">~{formatShortAmount(totalValue)}</span>
         </div>
       </div>
       <div ref={setNodeRef} className="flex-1 space-y-2 overflow-y-auto pb-2 custom-scrollbar pr-1">
         {clients.map(client => <ClientKanbanCard key={client.id} client={client} />)}
         {clients.length === 0 && <div className="text-center p-6 text-xs text-zinc-400 font-medium italic border-2 border-dashed border-zinc-200 rounded-xl mt-2">Letakkan kartu di sini</div>}
       </div>
    </div>
  );
}

function ClientKanbanCard({ client }: { client: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: client.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1, touchAction: 'none' };
  
  const getIconForIndustry = (ind: string) => {
    const l = ind?.toLowerCase() || '';
    if (l.includes('beauty') || l.includes('kecantikan') || l.includes('skincare')) return '✨';
    if (l.includes('food') || l.includes('f&b') || l.includes('makanan')) return '☕';
    if (l.includes('fashion') || l.includes('apparel')) return '🧥';
    if (l.includes('tech') || l.includes('teknologi')) return '💻';
    if (l.includes('oto') || l.includes('auto')) return '🚗';
    return '🏢';
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="bg-white p-3.5 rounded-xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group border border-zinc-200">
       <div className="flex items-start justify-between gap-1">
         <div className="flex items-center gap-2 min-w-0">
           <span className="text-xl leading-none">{getIconForIndustry(client.industry)}</span>
           <span className="text-[13px] font-bold text-zinc-900 group-hover:text-blue-600 transition-colors truncate">{client.name}</span>
         </div>
       </div>
       <div className="mt-2.5 space-y-1.5">
         <div className="inline-block px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-600 text-[10px] font-bold uppercase tracking-wider truncate max-w-full">
           {client.industry || 'Umum'}
         </div>
         <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
           <span className="material-symbols-outlined text-[14px]">folder_open</span>
           <span>{client._count?.projects || 0} Proyek</span>
         </div>
       </div>
       <div className="mt-3.5 pt-2 bg-zinc-50 -mx-3.5 -mb-3.5 px-3.5 py-2 flex items-center justify-between rounded-b-xl border-t border-zinc-100">
         <span className="font-mono text-xs font-bold text-zinc-900">{formatShortAmount(client.monthlyRetainer || 0)}<span className="text-zinc-500 font-normal">/bln</span></span>
         <Link href={`/clients/${client.id}`} className="text-[10px] bg-white border border-zinc-200 px-2 py-1 rounded text-zinc-700 font-bold hover:bg-slate-900 hover:text-white transition-colors" onPointerDown={e => e.stopPropagation()}>Detail ↗</Link>
       </div>
    </div>
  );
}
