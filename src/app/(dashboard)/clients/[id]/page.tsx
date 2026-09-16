'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatIDR, formatDate } from '@/lib/utils';
import { clientContactSchema, clientNoteSchema } from '@/lib/validations';
import Link from 'next/link';
import { STATUS_LABELS } from '@/lib/constants';

type Tab = 'INFO' | 'KONTAK' | 'PROYEK' | 'KONTEN' | 'KEUANGAN' | 'PERFORMA' | 'NOTES' | 'SHEET' | 'REPORT';
const TABS: { id: Tab; label: string; icon: string; countKey?: string }[] = [
  { id: 'INFO', label: 'Info Perusahaan', icon: 'business' },
  { id: 'KONTAK', label: 'Kontak', icon: 'contacts', countKey: 'contacts' },
  { id: 'PROYEK', label: 'Proyek', icon: 'folder', countKey: 'projects' },
  { id: 'KONTEN', label: 'Konten & Jadwal', icon: 'auto_stories', countKey: 'contents' },
  { id: 'KEUANGAN', label: 'Keuangan & Invoice', icon: 'receipt_long' },
  { id: 'PERFORMA', label: 'Performa & Analytics', icon: 'query_stats' },
  { id: 'NOTES', label: 'Catatan & Log', icon: 'forum' },
  { id: 'SHEET', label: 'Sheet Klien', icon: 'table_view' },
  { id: 'REPORT', label: 'Laporan Docs', icon: 'summarize' },
];

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('INFO');

  const fetchClient = async () => {
    const res = await fetch(`/api/clients/${params.id}`);
    if (res.ok) setClient(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchClient(); }, [params.id]);

  if (loading) return <div className="p-8 font-medium text-zinc-500 animate-pulse">Memuat data klien...</div>;
  if (!client) return <div className="p-8 text-red-500 font-bold">Klien tidak ditemukan.</div>;

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'LEAD': return 'bg-emerald-100 text-emerald-800';
      case 'PROSPECT': return 'bg-blue-50 text-blue-700';
      case 'PAUSED': return 'bg-orange-100 text-orange-800';
      case 'CHURNED': return 'bg-red-100 text-red-800';
      default: return 'bg-zinc-100 text-zinc-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'Aktif';
      case 'LEAD': return 'Lead';
      case 'PROSPECT': return 'Prospek';
      case 'PAUSED': return 'Pause';
      case 'CHURNED': return 'Churned';
      default: return status;
    }
  };

  return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full">
      <div className="px-6 space-y-6 max-w-[1720px] mx-auto w-full pb-10">
        
        {/* 1. BREADCRUMB & METADATA OVERLINE */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/clients" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Kembali ke Daftar Klien</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-xl shadow-sm border border-blue-100">
            <span className="material-symbols-outlined text-[15px] text-blue-600">fingerprint</span>
            <span className="text-[10px] font-bold text-zinc-900 tracking-wider uppercase">ID: {client.id.substring(0,8)}</span>
            <span className="text-zinc-400 text-[10px]">•</span>
            <span className="text-xs text-zinc-500 font-medium">Terakhir diupdate hari ini</span>
          </div>
        </div>

        {/* 2. HEADER KLIEN (Hero Card) */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
            <div className="relative flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 via-blue-50 to-emerald-100 flex items-center justify-center shadow-inner border border-zinc-100">
              <span className="text-[36px] select-none">{client.industry?.toLowerCase().includes('beauty') ? '🌸' : client.industry?.toLowerCase().includes('food') ? '☕' : '🏢'}</span>
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className={`w-3 h-3 rounded-full ${client.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl text-zinc-900 font-bold tracking-tight truncate">{client.name}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${getStatusStyle(client.status)}`}>
                  {client.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>}
                  {getStatusLabel(client.status)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium">
                  <span className="material-symbols-outlined text-[14px]">category</span>
                  {client.industry || 'Umum'}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">calendar_month</span>
                  <span>Masa Kontrak: <strong className="text-zinc-900 font-medium">Tahunan</strong></span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm">
                {client.website && (
                  <>
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors">
                      <span className="material-symbols-outlined text-[16px]">public</span>
                      <span className="underline underline-offset-2">{client.website.replace('https://','').replace('http://','')}</span>
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                    <span className="text-zinc-300">•</span>
                  </>
                )}
                <div className="flex items-center gap-1 text-zinc-500">
                  <span>Retainer:</span>
                  <span className="font-semibold text-zinc-900">{formatIDR(client.monthlyRetainer || 0)}<span className="font-normal text-zinc-500 text-xs">/bln</span></span>
                </div>
                <span className="text-zinc-300">•</span>
                <div className="flex items-center gap-1 text-zinc-500">
                  <span>Proyek Aktif:</span>
                  <span className="font-semibold text-zinc-900">{client._count?.projects || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start lg:self-center flex-shrink-0">
            <button className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-sm font-semibold transition-all shadow-sm" type="button">
              <span className="material-symbols-outlined text-[18px] text-blue-600">add_comment</span>
              <span>Log Aktivitas</span>
            </button>
            <button className="inline-flex items-center justify-center p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all shadow-sm" title="Hapus Klien" type="button">
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </section>

        {/* 3. NAVIGASI TABS */}
        <nav className="flex items-center gap-2 overflow-x-auto bg-white px-2 py-2 rounded-2xl shadow-sm border border-zinc-200 text-zinc-500 text-sm font-medium custom-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm font-semibold' : 'hover:bg-zinc-50 hover:text-zinc-900'}`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.countKey === 'contacts' && client.contacts?.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${activeTab === tab.id ? 'bg-slate-700 text-white' : 'bg-zinc-100 text-blue-600'}`}>
                  {client.contacts.length}
                </span>
              )}
              {tab.countKey === 'projects' && client._count?.projects > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${activeTab === tab.id ? 'bg-slate-700 text-white' : 'bg-zinc-100 text-blue-600'}`}>
                  {client._count.projects}
                </span>
              )}
              {tab.countKey === 'contents' && client._count?.contents > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${activeTab === tab.id ? 'bg-slate-700 text-white' : 'bg-zinc-100 text-blue-600'}`}>
                  {client._count.contents}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* 4. KONTEN TAB */}
        <div className="w-full">
          {activeTab === 'INFO' && <TabInfo client={client} onUpdate={fetchClient} />}
          {activeTab === 'KONTAK' && <TabContacts clientId={client.id} contacts={client.contacts} onUpdate={fetchClient} />}
          {activeTab === 'PROYEK' && <div className="text-zinc-500 bg-white p-8 rounded-3xl border border-zinc-200 text-center">Belum ada data proyek. Modul Proyek akan datang.</div>}
          {activeTab === 'KONTEN' && <div className="text-zinc-500 bg-white p-8 rounded-3xl border border-zinc-200 text-center">Belum ada konten untuk klien ini. Navigasi ke halaman Konten untuk membuat konten baru terkait klien ini.</div>}
          
          {activeTab === 'KEUANGAN' && (
            <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Total Pendapatan (LTV)</h3>
                <div className="text-3xl font-bold text-zinc-900">{formatIDR(client.totalRevenue || 0)}</div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Retainer Bulanan (MRR)</h3>
                <div className="text-3xl font-bold text-blue-600">{formatIDR(client.monthlyRetainer || 0)}</div>
              </div>
            </div>
          )}
          
          {activeTab === 'PERFORMA' && <div className="text-zinc-500 bg-white p-8 rounded-3xl border border-zinc-200 text-center">Data performa aggregate konten klien akan tampil di sini.</div>}
          
          {activeTab === 'NOTES' && <TabNotes clientId={client.id} initialNotes={client.clientNotes} />}
          
          {activeTab === 'SHEET' && <TabSheet clientId={client.id} />}
          
          {activeTab === 'REPORT' && <TabReport clientId={client.id} />}
        </div>
        
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// KOMPONEN TABS
// ----------------------------------------------------------------------

function TabInfo({ client, onUpdate }: { client: any, onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: client.name,
      industry: client.industry || '',
      website: client.website || '',
      monthlyRetainer: client.monthlyRetainer || 0,
    }
  });

  const onSubmit = async (data: any) => {
    const res = await fetch(`/api/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      toast.success('Info diupdate');
      setIsEditing(false);
      onUpdate();
    } else toast.error('Gagal update');
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-zinc-200 max-w-2xl animate-in fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900">Edit Informasi Klien</h2>
          <button onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-zinc-600"><span className="material-symbols-outlined">close</span></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nama Klien</Label><Input {...register('name')} className="bg-zinc-50" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Industri</Label><Input {...register('industry')} className="bg-zinc-50" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Website</Label><Input {...register('website')} className="bg-zinc-50" /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Retainer Bulanan (Rp)</Label><Input type="number" {...register('monthlyRetainer')} className="bg-zinc-50" /></div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">Simpan Perubahan</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in">
      {/* KOLOM KIRI (7 Kolom) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* CARD A: Detail Korporat */}
        <article className="bg-white rounded-[2rem] p-6 shadow-sm border border-zinc-200 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-blue-600">corporate_fare</span>
              <h2 className="text-lg text-zinc-900 font-bold">Informasi Perusahaan</h2>
            </div>
            <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors" type="button">
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Ubah Info</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col p-3 bg-zinc-50 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Nama Legal Badan Usaha</span>
              <span className="font-semibold text-zinc-900">{client.name}</span>
            </div>
            <div className="flex flex-col p-3 bg-zinc-50 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Industri / Sektor</span>
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>{client.industry || 'Belum diset'}</span>
              </div>
            </div>
            <div className="flex flex-col p-3 bg-zinc-50 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Website Resmi</span>
              {client.website ? (
                <a className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold" href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer">
                  <span>{client.website}</span>
                  <span className="material-symbols-outlined text-[14px]">north_east</span>
                </a>
              ) : <span className="font-medium text-zinc-400">-</span>}
            </div>
            <div className="flex flex-col p-3 bg-zinc-50 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Status Klien</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">{client.status}</span>
              </div>
            </div>
            <div className="flex flex-col p-3 bg-zinc-50 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Retainer Bulanan</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-zinc-900">{formatIDR(client.monthlyRetainer || 0)}</span>
                <span className="text-zinc-500 text-xs">/ bulan</span>
              </div>
            </div>
            <div className="flex flex-col p-3 bg-zinc-50 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total LTV (Realisasi)</span>
              <div className="flex items-center gap-1 font-semibold text-emerald-600">
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                <span>{formatIDR(client.totalRevenue || 0)}</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* KOLOM KANAN (5 Kolom) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* CARD A: Key Performance Overview (Bento) */}
        <article className="bg-white rounded-[2rem] p-6 shadow-sm border border-zinc-200 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Client Overview</span>
            <span className="material-symbols-outlined text-[18px] text-zinc-400">insights</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-50 rounded-2xl flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Total Proyek</span>
                <span className="material-symbols-outlined text-[18px] text-blue-600">folder_open</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-zinc-900">{client._count?.projects || 0}</span>
                <span className="text-xs text-zinc-500 block">Aktif berjalan</span>
              </div>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Total Konten</span>
                <span className="material-symbols-outlined text-[18px] text-blue-600">post_add</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-zinc-900">{client._count?.contents || 0}</span>
                <span className="text-xs text-zinc-500 block">Produksi All-time</span>
              </div>
            </div>
          </div>
        </article>

        {/* CARD B: SLA Delivery Tracker */}
        <article className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-emerald-400">speed</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">SLA Konten Bulan Ini</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-500 text-white text-[10px] font-bold uppercase">ON TRACK</span>
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-white">Sehat</span>
              <span className="text-xs text-slate-400">Berjalan lancar</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: '90%' }}></div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB KONTAK
// ----------------------------------------------------------------------

function TabContacts({ clientId, contacts, onUpdate }: { clientId: string, contacts: any[], onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(clientContactSchema),
    defaultValues: { name: '', position: '', email: '', phone: '', whatsapp: '', isPrimary: false }
  });

  const onSubmit = async (data: any) => {
    const res = await fetch(`/api/clients/${clientId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      toast.success('Kontak ditambahkan');
      reset();
      setIsOpen(false);
      onUpdate();
    } else toast.error('Gagal tambah kontak');
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-zinc-200">
        <div className="flex items-center gap-2 text-zinc-900">
          <span className="material-symbols-outlined text-blue-600">account_circle</span>
          <h2 className="font-bold">Daftar Kontak (Stakeholders)</h2>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors">
          {isOpen ? 'Batal' : '+ Tambah Kontak'}
        </button>
      </div>

      {isOpen && (
        <div className="bg-white p-6 rounded-3xl shadow-md border border-zinc-200 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-bold mb-4">Tambah Kontak Baru</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase">Nama Lengkap</Label><Input {...register('name')} required className="bg-zinc-50" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase">Posisi/Jabatan</Label><Input {...register('position')} className="bg-zinc-50" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase">Email</Label><Input type="email" {...register('email')} className="bg-zinc-50" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase">No. HP / WhatsApp</Label><Input {...register('phone')} className="bg-zinc-50" /></div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isPrimary" {...register('isPrimary')} className="w-4 h-4 accent-blue-600" />
              <Label htmlFor="isPrimary" className="font-medium text-zinc-700">Jadikan Kontak Utama (Primary Stakeholder)</Label>
            </div>
            <div className="flex justify-end pt-4"><Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Simpan Kontak</Button></div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map(c => (
          <div key={c.id} className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200 flex flex-col gap-3 group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {c.name.substring(0,2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-900 truncate">{c.name}</span>
                    {c.isPrimary && <span className="material-symbols-outlined text-[14px] text-orange-500" title="Primary Stakeholder" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>}
                  </div>
                  <span className="text-xs text-zinc-500 truncate">{c.position || 'Staf'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mt-2 bg-zinc-50 p-3 rounded-xl">
              {c.email && (
                <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-zinc-700 hover:text-blue-600 transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-zinc-400">mail</span>
                  <span className="truncate">{c.email}</span>
                </a>
              )}
              {c.phone && (
                <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-zinc-700 hover:text-emerald-600 transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-zinc-400">call</span>
                  <span>{c.phone}</span>
                </a>
              )}
            </div>
          </div>
        ))}
        {contacts.length === 0 && <div className="col-span-full text-center bg-white border border-zinc-200 border-dashed rounded-3xl p-10 text-zinc-400 font-medium">Belum ada kontak stakeholder yang ditambahkan.</div>}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB NOTES
// ----------------------------------------------------------------------

function TabNotes({ clientId, initialNotes }: { clientId: string, initialNotes: any[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(clientNoteSchema),
    defaultValues: { title: '', content: '' }
  });

  const onSubmit = async (data: any) => {
    const res = await fetch(`/api/clients/${clientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      toast.success('Catatan ditambahkan');
      reset();
      setIsOpen(false);
      const resList = await fetch(`/api/clients/${clientId}/notes`);
      if (resList.ok) setNotes(await resList.json());
    } else toast.error('Gagal tambah catatan');
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-zinc-200">
        <div className="flex items-center gap-2 text-zinc-900">
          <span className="material-symbols-outlined text-blue-600">forum</span>
          <h2 className="font-bold">Log & Catatan Pertemuan</h2>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors">
          {isOpen ? 'Batal' : '+ Tambah Catatan'}
        </button>
      </div>

      {isOpen && (
        <div className="bg-white p-6 rounded-3xl shadow-md border border-zinc-200 animate-in slide-in-from-top-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase">Topik / Judul</Label><Input {...register('title')} className="bg-zinc-50" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase">Isi Catatan</Label><Textarea {...register('content')} rows={4} className="bg-zinc-50" /></div>
            <div className="flex justify-end pt-2"><Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Simpan Log</Button></div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {notes.map(n => (
          <div key={n.id} className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">{n.author?.name?.substring(0,2).toUpperCase() || 'UN'}</div>
                <span className="font-bold text-zinc-900">{n.author?.name || 'Seseorang'}</span>
                <span className="text-xs text-zinc-400">• {formatDate(n.createdAt)}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider">{n.title}</span>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed pl-10 whitespace-pre-wrap">{n.content}</p>
          </div>
        ))}
        {notes.length === 0 && <div className="text-center bg-white border border-zinc-200 border-dashed rounded-3xl p-10 text-zinc-400 font-medium">Belum ada catatan aktivitas untuk klien ini.</div>}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB SHEET & REPORT
// ----------------------------------------------------------------------

function TabSheet({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    
    try {
      const res = await fetch('/api/sheets/client-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, emailToShare: email })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Client Progress Sheet berhasil dibuat!');
        window.open(data.url, '_blank');
      } else {
        toast.error(data.error || 'Gagal generate sheet');
      }
    } catch(err) {
      toast.error('Terjadi kesalahan');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-zinc-200 max-w-2xl animate-in fade-in">
      <div className="flex items-center gap-2 mb-4 text-emerald-600">
        <span className="material-symbols-outlined text-[24px]">table_view</span>
        <h2 className="text-xl font-bold text-zinc-900">Google Sheets Sync</h2>
      </div>
      <form onSubmit={handleGenerate} className="space-y-6">
        <p className="text-sm text-zinc-600 leading-relaxed">
          Sistem akan men-generate Spreadsheet otomatis yang berisi <strong>daftar seluruh konten klien (terjadwal dan sudah dipublikasi)</strong> beserta status dan tautan asetnya. Anda dapat membagikan sheet ini langsung ke klien.
        </p>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-500 uppercase">Email Klien (Opsional - Beri Akses View)</Label>
          <Input name="email" type="email" placeholder="client@company.com" className="bg-zinc-50 h-10" />
        </div>
        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6">
          {loading ? 'Membuat Spreadsheet...' : 'Generate Progress Sheet'}
        </Button>
      </form>
    </div>
  );
}

function TabReport({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/docs?type=report&clientId=${clientId}`).then(r => r.json()).then(setReports);
  }, [clientId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const period = formData.get('period') as string;
    
    try {
      const resTemp = await fetch('/api/docs/templates');
      const templates = await resTemp.json();
      const reportTemp = templates.find((t: any) => t.type === 'report');
      if (!reportTemp) {
        toast.error('Template report belum dibuat di menu Google Docs.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, templateId: reportTemp.id, period })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Laporan berhasil dibuat!');
        window.open(data.docUrl, '_blank');
        fetch(`/api/docs?type=report&clientId=${clientId}`).then(r => r.json()).then(setReports);
      } else {
        toast.error(data.error || 'Gagal generate laporan');
      }
    } catch(err) {
      toast.error('Terjadi kesalahan');
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-zinc-200">
        <div className="flex items-center gap-2 mb-4 text-blue-600">
          <span className="material-symbols-outlined text-[24px]">description</span>
          <h2 className="text-lg font-bold text-zinc-900">Generate Report Google Docs</h2>
        </div>
        <form onSubmit={handleGenerate} className="space-y-6">
          <p className="text-sm text-zinc-600">Pilih periode laporan bulanan untuk menyalin data kinerja (jika tersedia) ke dalam template Docs.</p>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-500 uppercase">Periode Bulan</Label>
            <Input name="period" type="month" required className="bg-zinc-50 h-10" />
          </div>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
            {loading ? 'Memproses...' : 'Buat Laporan Baru'}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-zinc-200">
        <div className="flex items-center gap-2 mb-4 text-zinc-900">
          <span className="material-symbols-outlined text-[20px]">history</span>
          <h2 className="text-lg font-bold">Riwayat Laporan Dibuat</h2>
        </div>
        <div className="space-y-3">
          {reports.length === 0 ? <p className="text-sm text-zinc-500 font-medium">Belum ada laporan yang dibuat.</p> : reports.map(r => (
            <a key={r.id} href={r.docUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 border border-zinc-200 rounded-2xl hover:bg-zinc-50 transition-colors group">
              <div className="flex flex-col">
                <span className="font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">{r.title}</span>
                <span className="text-xs text-zinc-500">{new Date(r.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
              <span className="material-symbols-outlined text-zinc-400 group-hover:text-blue-600 transition-colors">open_in_new</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
