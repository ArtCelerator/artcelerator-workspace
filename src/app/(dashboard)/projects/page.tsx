'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { formatIDR, formatDateShort } from '@/lib/utils';
import Link from 'next/link';
import { differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(3, "Minimal 3 karakter"),
  clientId: z.string().min(1, "Pilih klien"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.coerce.number().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).default('PLANNING'),
});

type FormData = z.infer<typeof formSchema>;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', clientId: '', status: 'PLANNING', budget: 0 }
  });

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (clientFilter !== 'ALL') params.append('clientId', clientFilter);
    if (statusFilter !== 'ALL') params.append('status', statusFilter);
    
    const [pRes, cRes] = await Promise.all([
      fetch(`/api/projects?${params.toString()}`),
      fetch('/api/clients')
    ]);
    if (pRes.ok) setProjects(await pRes.json());
    if (cRes.ok) setClients(await cRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search, clientFilter, statusFilter]);

  const onSubmit = async (data: any) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      toast.success('Proyek berhasil dibuat');
      setIsFormOpen(false);
      reset();
      fetchData();
    } catch {
      toast.error('Gagal membuat proyek');
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'ACTIVE': return { label: 'AKTIF', color: 'bg-blue-100 text-blue-700', bg: 'bg-blue-600', ping: true };
      case 'PLANNING': return { label: 'PERENCANAAN', color: 'bg-zinc-100 text-zinc-600', bg: 'bg-zinc-400', ping: false };
      case 'ON_HOLD': return { label: 'ON HOLD', color: 'bg-orange-100 text-orange-700', bg: 'bg-orange-500', ping: false };
      case 'COMPLETED': return { label: 'SELESAI', color: 'bg-emerald-100 text-emerald-700', bg: 'bg-emerald-500', ping: false, icon: 'check_circle' };
      case 'CANCELLED': return { label: 'DIBATALKAN', color: 'bg-red-100 text-red-700', bg: 'bg-red-500', ping: false };
      default: return { label: status, color: 'bg-zinc-100 text-zinc-700', bg: 'bg-zinc-400', ping: false };
    }
  };

  const getProgressInfo = (project: any) => {
    const total = project._count?.contents || 0;
    if (total === 0) return { percent: 0, published: 0, total: 0 };
    const published = project.contents?.filter((c: any) => c.status === 'PUBLISHED').length || 0;
    const percent = Math.round((published / total) * 100);
    return { percent, published, total };
  };

  const getDaysLeft = (endDateStr: string) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const today = new Date();
    return differenceInDays(end, today);
  };

  // Metrics
  const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length;
  const planningProjectsCount = projects.filter(p => p.status === 'PLANNING' || p.status === 'COMPLETED').length;
  const totalValue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  
  const allProgress = projects.map(getProgressInfo).filter(p => p.total > 0);
  const avgProgress = allProgress.length > 0 
    ? Math.round(allProgress.reduce((sum, p) => sum + p.percent, 0) / allProgress.length) 
    : 0;
    
  // Find project with closest deadline
  const closestDeadlineProject = useMemo(() => {
    const active = projects.filter(p => p.status === 'ACTIVE' && p.endDate);
    if (active.length === 0) return null;
    return active.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0];
  }, [projects]);

  return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full">
      <div className="px-6 space-y-6 max-w-[1720px] mx-auto w-full pb-10">
        
        {/* 1. SUPER HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full self-start mb-2">
              MANAJEMEN PROYEK AGENSI
            </span>
            <h1 className="text-3xl text-zinc-900 font-bold tracking-tight flex items-center gap-2">
              <span>📁</span> Proyek Klien
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Kelola seluruh proyek, tenggat waktu, anggaran, dan progres deliverable agensi Anda.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button className="flex items-center gap-1.5 bg-white text-zinc-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-50 shadow-sm border border-zinc-200 transition-all" type="button">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">bar_chart</span>
              <span>Statistik & Kapasitas</span>
            </button>
            <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-md transition-all active:scale-95" type="button">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Buat Proyek</span>
            </button>
          </div>
        </div>

        {/* 2. KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Proyek Aktif</span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">layers</span>
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl text-zinc-900 block leading-none font-bold">{activeProjectsCount} Proyek</span>
              <span className="text-xs text-zinc-500 mt-1 block">{planningProjectsCount} Perencanaan / Selesai</span>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Nilai Kontrak</span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl text-zinc-900 block leading-none font-bold">{formatIDR(totalValue)}</span>
              <span className="text-xs text-zinc-500 mt-1 block">Realisasi deliverable (Semua status)</span>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rata-rata Deliverable</span>
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">donut_large</span>
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl text-zinc-900 leading-none font-bold">{avgProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${avgProgress}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Deadline Terdekat</span>
              <span className="w-8 h-8 rounded-lg bg-slate-800 text-orange-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">alarm</span>
              </span>
            </div>
            <div className="mt-3">
              {closestDeadlineProject ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-white leading-none font-bold">{formatDateShort(closestDeadlineProject.endDate)}</span>
                    {getDaysLeft(closestDeadlineProject.endDate) !== null && getDaysLeft(closestDeadlineProject.endDate)! <= 7 && (
                      <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold">URGENT</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-300 mt-1 block truncate">{closestDeadlineProject.name} • {closestDeadlineProject.client.name}</span>
                </>
              ) : (
                <div className="flex items-center gap-2 h-full">
                  <span className="text-lg text-slate-400 font-medium italic">Tidak ada deadline dekat</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. FILTER BAR */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-zinc-200 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px] pointer-events-none">search</span>
              <input 
                className="w-full h-9 pl-9 pr-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-inner transition-all" 
                placeholder="Cari nama proyek..." 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <select 
                className="h-9 px-3 pr-8 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="ALL">Semua Klien</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[16px] pointer-events-none">expand_more</span>
            </div>
            <div className="relative">
              <select 
                className="h-9 px-3 pr-8 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Semua Status</option>
                <option value="PLANNING">Perencanaan</option>
                <option value="ACTIVE">Aktif</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Selesai</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[16px] pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 self-end xl:self-auto w-full xl:w-auto">
            <span className="text-sm text-zinc-500">Menampilkan <strong>{projects.length}</strong> Proyek</span>
          </div>
        </div>

        {/* 4. PROJECTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full py-20 text-center text-zinc-500 font-medium animate-pulse">Memuat data proyek...</div>
          ) : projects.length === 0 ? (
             <div className="col-span-full py-20 text-center text-zinc-400 font-medium">Tidak ada proyek yang sesuai dengan filter.</div>
          ) : (
            projects.map(project => {
              const conf = getStatusConfig(project.status);
              const prog = getProgressInfo(project);
              const daysLeft = getDaysLeft(project.endDate);

              return (
                <Link href={`/projects/${project.id}`} key={project.id} className="block group">
                  <div className="bg-white rounded-[1.25rem] p-5 shadow-sm hover:shadow-md border border-zinc-200 transition-all duration-200 flex flex-col justify-between h-full group-hover:border-zinc-300">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`${conf.color} text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-bold tracking-wider`}>
                          {conf.icon ? (
                            <span className="material-symbols-outlined text-[14px]">{conf.icon}</span>
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${conf.bg} ${conf.ping ? 'animate-pulse' : ''}`}></span>
                          )}
                          {conf.label}
                        </span>
                        <button className="text-zinc-400 hover:text-zinc-900 p-1 rounded transition-colors" type="button" onClick={e => e.preventDefault()}>
                          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                        </button>
                      </div>
                      
                      <h3 className="text-lg text-zinc-900 group-hover:text-blue-600 transition-colors mt-3 font-bold truncate">
                        {project.name}
                      </h3>
                      <p className="text-sm text-zinc-500 font-medium flex items-center gap-1.5 mb-4 truncate">
                        {project.client.name}
                      </p>
                      
                      {/* Progress Deliverable */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold text-zinc-900">
                          <span>Progres Konten</span>
                          <span className="font-mono text-blue-600">{prog.percent}%</span>
                        </div>
                        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${prog.percent === 100 ? 'bg-emerald-500' : 'bg-slate-900'}`} style={{ width: `${prog.percent}%` }}></div>
                        </div>
                        <p className="text-[11px] text-zinc-500">{prog.published} dari {prog.total} konten dipublikasikan</p>
                      </div>
                      
                      {/* Meta Card */}
                      <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 my-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 flex items-center gap-1.5 text-xs font-medium">
                            <span className="text-[16px]">💰</span> Budget:
                          </span>
                          <span className="font-bold text-zinc-900 font-mono text-xs">{formatIDR(project.budget || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 flex items-center gap-1.5 text-xs font-medium">
                            <span className="text-[16px]">📅</span> Deadline:
                          </span>
                          <div className="flex items-center">
                            <span className="text-zinc-900 font-semibold text-xs">{project.endDate ? formatDateShort(project.endDate) : '-'}</span>
                            {project.status !== 'COMPLETED' && daysLeft !== null && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm ml-1.5 ${daysLeft < 0 ? 'bg-red-100 text-red-700' : daysLeft <= 7 ? 'bg-orange-100 text-orange-700' : 'bg-white border border-zinc-200 text-zinc-600'}`}>
                                {daysLeft < 0 ? 'Terlewat' : `Sisa ${daysLeft} hari`}
                              </span>
                            )}
                            {project.status === 'COMPLETED' && (
                               <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm ml-1.5 bg-emerald-100 text-emerald-700">Tercapai</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-3 mt-auto border-t border-zinc-100">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {project.members.slice(0, 4).map((m: any, idx: number) => (
                            <div key={m.id} className={`w-7 h-7 rounded-full text-white font-bold text-[10px] flex items-center justify-center shadow-sm border-2 border-white ${['bg-slate-900','bg-blue-600','bg-emerald-500','bg-orange-500'][idx%4]}`}>
                              {m.user.name.substring(0,2).toUpperCase()}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs font-medium text-zinc-500">{project.members.length} Anggota</span>
                      </div>
                      <span className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                        Detail <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

      </div>

      {/* MODAL DIALOG: TAMBAH PROYEK */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-300">create_new_folder</span>
                <h3 className="text-lg font-bold text-white">Buat Proyek Baru</h3>
              </div>
              <button className="p-1 rounded text-slate-400 hover:text-white transition-colors" onClick={() => setIsFormOpen(false)} type="button">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Nama Proyek</label>
                  <input 
                    {...register('name')}
                    className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner" 
                    placeholder="mis. Social Media Management Q3" 
                    type="text"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Klien (Owner)</label>
                  <select 
                    {...register('clientId')}
                    className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="">-- Pilih Klien --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId.message as string}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Status Awal</label>
                  <select 
                    {...register('status')}
                    className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="PLANNING">Planning (Perencanaan)</option>
                    <option value="ACTIVE">Active (Berjalan)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Mulai (Start Date)</label>
                  <input type="date" {...register('startDate')} className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Deadline (End Date)</label>
                  <input type="date" {...register('endDate')} className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Budget / Nilai Proyek (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-400">Rp</span>
                    <input 
                      {...register('budget')}
                      className="w-full h-10 pl-9 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                      placeholder="10000000" 
                      type="number"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Deskripsi & Scope Deliverable</label>
                  <Textarea {...register('description')} rows={3} className="bg-zinc-50" placeholder="Jelaskan ruang lingkup pekerjaan..." />
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
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2" 
                  type="submit"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Simpan Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
