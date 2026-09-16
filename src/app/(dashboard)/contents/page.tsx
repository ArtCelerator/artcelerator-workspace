'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { StatusBadge } from '@/components/content/status-badge';
import { formatDateShort } from '@/lib/utils';
import {
  ContentStatus, Platform, ContentType, Priority,
  STATUS_LABELS, PLATFORM_INFO, CONTENT_TYPE_INFO, PRIORITY_LABELS
} from '@/lib/constants';

const formSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  contentType: z.string().min(1, "Wajib diisi"),
  platform: z.string().min(1, "Wajib diisi"),
  pillarId: z.string().optional(),
  clientId: z.string().optional(),
  publishDate: z.string().optional(),
  publishTime: z.string().optional(),
  priority: z.string().min(1, "Wajib diisi"),
  caption: z.string().optional(),
  notes: z.string().optional(),
});

export default function ContentsPage() {
  const [contents, setContents] = useState<any[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [pillarFilter, setPillarFilter] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '', contentType: 'SOCIAL_POST', platform: 'INSTAGRAM',
      pillarId: '', clientId: '', publishDate: '', publishTime: '', priority: 'MEDIUM', caption: '', notes: ''
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      const dateParam = urlParams.get('date');
      
      if (searchParam) setSearch(searchParam);
      if (dateParam) {
        setIsFormOpen(true);
        setValue('publishDate', dateParam);
      }
    }
  }, [setValue]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);
    if (platformFilter) params.append('platform', platformFilter);
    if (pillarFilter) params.append('pillarId', pillarFilter);

    const res = await fetch(`/api/contents?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setContents(data);
    }

    const resPillars = await fetch('/api/pillars');
    if (resPillars.ok) {
      const p = await resPillars.json();
      setPillars(p);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, platformFilter, pillarFilter]);

  const onSubmit = async (data: any) => {
    try {
      const url = editingId ? `/api/contents/${editingId}` : '/api/contents';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...data,
        pillarId: data.pillarId || null,
        clientId: data.clientId || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menyimpan konten');
      }

      toast.success(editingId ? 'Konten diperbarui' : 'Konten dibuat');
      setIsFormOpen(false);
      setEditingId(null);
      reset();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setValue('title', item.title);
    setValue('contentType', item.contentType);
    setValue('platform', item.platform);
    setValue('pillarId', item.pillarId || '');
    setValue('clientId', item.clientId || '');
    setValue('publishDate', item.publishDate ? item.publishDate.split('T')[0] : '');
    setValue('publishTime', item.publishTime || '');
    setValue('priority', item.priority);
    setValue('caption', item.caption || '');
    setValue('notes', item.notes || '');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus (arsip)?')) return;
    try {
      const res = await fetch(`/api/contents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Konten dihapus');
      fetchData();
    } catch (e) {
      toast.error('Gagal menghapus');
    }
  };

  const handleChangeStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/contents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Akses ditolak atau transisi tidak valid');
      toast.success('Status diupdate');
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="flex flex-col w-full bg-zinc-50 min-h-full">
      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <h1 className="text-2xl text-zinc-900 tracking-tight font-semibold">Daftar Konten</h1>
            </div>
            <p className="text-sm text-zinc-500 mt-1">Kelola ide, jadwalkan postingan, dan perbarui status konten agensi Anda.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/pillars">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-900 text-sm font-medium shadow-sm hover:bg-zinc-50 transition-all active:scale-[0.98]" type="button">
                <span className="material-symbols-outlined text-[18px] text-zinc-500">category</span>
                <span>Kelola Pilar</span>
              </button>
            </Link>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-900 text-sm font-medium shadow-sm hover:bg-zinc-50 transition-all active:scale-[0.98]" type="button">
              <span className="material-symbols-outlined text-[18px] text-zinc-500">file_download</span>
              <span>Ekspor</span>
            </button>
            <button 
              onClick={() => { setEditingId(null); reset(); setIsFormOpen(!isFormOpen); }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-md hover:bg-slate-800 transition-all active:scale-[0.98]" 
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">{isFormOpen ? 'close' : 'add'}</span>
              <span>{isFormOpen ? 'Batal' : 'Buat Konten'}</span>
            </button>
          </div>
        </div>

        {/* FORM MODAL / PANEL */}
        {isFormOpen && (
          <div className="bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden animate-in slide-in-from-top-4">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
              <h2 className="text-lg font-semibold text-zinc-900">{editingId ? 'Edit Konten' : 'Buat Konten Baru'}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900">Judul Konten</label>
                    <input {...register('title')} placeholder="Judul..." className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.title && <p className="text-red-500 text-xs">{errors.title.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900">Tipe Konten</label>
                    <select {...register('contentType')} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(CONTENT_TYPE_INFO).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900">Platform</label>
                    <select {...register('platform')} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(PLATFORM_INFO).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900">Pilar Konten</label>
                    <select {...register('pillarId')} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Pilih Pilar --</option>
                      {pillars.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900">Tanggal Publish</label>
                    <input type="date" {...register('publishDate')} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900">Jam Publish</label>
                    <input type="time" {...register('publishTime')} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900">Prioritas</label>
                    <select {...register('priority')} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Caption</label>
                  <textarea {...register('caption')} placeholder="Tulis caption di sini..." rows={3} className="flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Catatan (Internal)</label>
                  <input {...register('notes')} placeholder="Catatan tim..." className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors">Batal</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Simpan Konten</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* METRICS MINI SUMMARY / TAB PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button 
            onClick={() => setStatusFilter('')} 
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm shadow-sm transition-colors ${statusFilter === '' ? 'bg-slate-900 text-white' : 'bg-white text-zinc-500 hover:text-zinc-900'}`}
          >
            <span>Semua</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusFilter === '' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'}`}>{contents.length}</span>
          </button>
          
          {Object.entries(STATUS_LABELS).map(([k, v]) => {
            const count = contents.filter(c => c.status === k).length;
            const isActive = statusFilter === k;
            let countClass = 'bg-zinc-100 text-zinc-500';
            if (isActive) {
               if (k === 'IDEA') countClass = 'bg-amber-500/20 text-amber-500';
               else if (k === 'DRAFTING') countClass = 'bg-blue-500/20 text-blue-500';
               else if (k === 'REVIEW') countClass = 'bg-purple-500/20 text-purple-500';
               else if (k === 'SCHEDULED') countClass = 'bg-indigo-500/20 text-indigo-500';
               else if (k === 'PUBLISHED') countClass = 'bg-emerald-500/20 text-emerald-500';
               else countClass = 'bg-white/20 text-white';
            }
            
            return (
              <button 
                key={k}
                onClick={() => setStatusFilter(k)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm shadow-sm transition-colors whitespace-nowrap ${isActive ? 'bg-slate-900 text-white' : 'bg-white text-zinc-500 hover:text-zinc-900'}`}
              >
                <span>{v}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${countClass}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* FILTER & SEARCH BAR */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4 border border-zinc-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2 items-center">
            {/* Search */}
            <div className="lg:col-span-4 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400 pointer-events-none">search</span>
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-12 rounded-xl bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-zinc-200 transition-all" 
                placeholder="Cari judul konten atau klien..." 
                type="text"
              />
            </div>
            
            {/* Status Filter */}
            <div className="lg:col-span-2 relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-xl bg-zinc-50 text-sm text-zinc-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-zinc-200 transition-all cursor-pointer"
              >
                <option value="">Semua Status</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400 pointer-events-none">expand_more</span>
            </div>
            
            {/* Platform Filter */}
            <div className="lg:col-span-2 relative">
              <select 
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-xl bg-zinc-50 text-sm text-zinc-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-zinc-200 transition-all cursor-pointer"
              >
                <option value="">Semua Platform</option>
                {Object.entries(PLATFORM_INFO).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400 pointer-events-none">expand_more</span>
            </div>
            
            {/* Pillar Filter */}
            <div className="lg:col-span-2 relative">
              <select 
                value={pillarFilter}
                onChange={(e) => setPillarFilter(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-xl bg-zinc-50 text-sm text-zinc-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-zinc-200 transition-all cursor-pointer"
              >
                <option value="">Semua Pilar</option>
                {pillars.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400 pointer-events-none">expand_more</span>
            </div>
            
            {/* Reset */}
            <div className="lg:col-span-2 flex items-center justify-end gap-2">
              <button 
                onClick={() => { setSearch(''); setStatusFilter(''); setPlatformFilter(''); setPillarFilter(''); }}
                className="text-zinc-500 hover:text-zinc-900 text-sm underline px-1 shrink-0" 
                type="button"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer accent-blue-600" type="checkbox" />
                <span className="text-sm text-zinc-700 font-medium">Menampilkan <span className="font-semibold text-blue-600">{contents.length}</span> Konten</span>
              </label>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center bg-white p-0.5 rounded-lg shadow-sm border border-zinc-200">
                <button className="p-1 px-2 rounded bg-blue-50 text-blue-700 text-xs font-semibold flex items-center gap-1" title="Tampilan Tabel" type="button">
                  <span className="material-symbols-outlined text-[16px]">view_list</span>
                  <span>Tabel</span>
                </button>
                <button className="p-1 px-2 rounded text-zinc-500 hover:text-zinc-900 text-xs font-medium flex items-center gap-1 transition-colors" title="Tampilan Grid" type="button">
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                  <span>Grid</span>
                </button>
              </div>
              <button onClick={fetchData} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors" title="Muat Ulang Data" type="button">
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>
          </div>
          
          {/* Responsive Table View */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white text-zinc-500 text-[11px] font-bold uppercase tracking-wider border-b border-zinc-200">
                  <th className="py-2 pl-4 pr-2 w-10" scope="col">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-2 px-2 min-w-[280px]" scope="col">Judul Konten & Pilar</th>
                  <th className="py-2 px-2 min-w-[180px]" scope="col">Platform & Format</th>
                  <th className="py-2 px-2 min-w-[180px]" scope="col">Rencana Publish</th>
                  <th className="py-2 px-2 min-w-[140px]" scope="col">Status</th>
                  <th className="py-2 px-2 min-w-[160px]" scope="col">Ubah Status</th>
                  <th className="py-2 pr-4 pl-2 text-right w-24" scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm text-zinc-900">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-zinc-500">
                      <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                    </td>
                  </tr>
                ) : contents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500">
                      Tidak ada konten yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  contents.map((item) => {
                    const plat = PLATFORM_INFO[item.platform as Platform];
                    const typeInfo = CONTENT_TYPE_INFO[item.contentType as ContentType];

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50 transition-colors group">
                        <td className="py-3 pl-4 pr-2">
                          <input className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer accent-blue-600" type="checkbox" />
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col">
                            <Link href={`/contents/${item.id}`}>
                              <span className="text-base font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors cursor-pointer">
                                {item.title}
                              </span>
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500">
                              <span className="font-medium text-zinc-700">{item.client?.name || 'Internal'}</span>
                              {item.pillar && (
                                <>
                                  <span>•</span>
                                  <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" style={{ color: item.pillar.color }}>
                                    {item.pillar.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-sm">
                            <span>{plat?.icon}</span>
                            <span className="font-medium">{plat?.label}</span>
                            <span className="text-zinc-400">•</span>
                            <span className="text-xs">{typeInfo?.icon} {typeInfo?.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-xs">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            <span>{item.publishDate ? formatDateShort(item.publishDate) : 'TBA'} {item.publishTime ? `(${item.publishTime})` : ''}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3 px-2">
                          <select 
                            className="h-8 px-2 pr-6 rounded-lg bg-zinc-50 text-xs text-zinc-900 border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors hover:bg-zinc-100"
                            value={item.status}
                            onChange={(e) => handleChangeStatus(item.id, e.target.value)}
                          >
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 pr-4 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-blue-600 transition-colors" title="Edit">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors" title="Hapus">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* TABLE PAGINATION FOOTER */}
          <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-sm text-zinc-500">
              Halaman <span className="font-semibold text-zinc-900">1</span> dari <span className="font-semibold text-zinc-900">1</span> (Total <span className="font-semibold text-zinc-900">{contents.length}</span> Konten)
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg text-zinc-300 cursor-not-allowed flex items-center justify-center" disabled>
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-semibold flex items-center justify-center shadow-sm">1</button>
              </div>
              <button className="p-1.5 rounded-lg text-zinc-300 cursor-not-allowed flex items-center justify-center" disabled>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* QUICK CREATIVE INSIGHT BENTO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Kecepatan Publikasi</span>
                <span className="material-symbols-outlined text-orange-500 text-[20px]">bolt</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">94.2%</span>
                <span className="text-xs text-blue-200">On-time</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">12 konten siap publish otomatis minggu ini sesuai jadwal.</p>
            </div>
            <div className="mt-4 pt-2">
              <svg className="w-full h-8 text-blue-500/50" fill="none" stroke="currentColor" viewBox="0 0 100 24">
                <path d="M0 18 Q 20 8, 40 14 T 70 6 T 100 2" fill="none" strokeLinecap="round" strokeWidth="2"></path>
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200 flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-zinc-300 text-[32px]">image</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Aset Terpopuler Minggu Ini</span>
              <span className="text-base font-semibold text-zinc-900 truncate mt-0.5">5 Tips Seduh Kopi</span>
              <p className="text-xs text-zinc-500 mt-1">Diproyeksikan 45k views dalam 48 jam pertama penayangan.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Distribusi Format</span>
                <span className="material-symbols-outlined text-zinc-400 text-[18px]">pie_chart</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="h-2 rounded-full bg-blue-600 flex-1"></div>
                <div className="h-2 rounded-full bg-orange-500 w-1/4"></div>
                <div className="h-2 rounded-full bg-slate-300 w-1/6"></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-4 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Reels (68%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Carousel (22%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Story (10%)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
