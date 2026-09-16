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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR, formatDate } from '@/lib/utils';
import { clientContactSchema, clientNoteSchema } from '@/lib/validations';
import Link from 'next/link';

type Tab = 'INFO' | 'KONTAK' | 'PROYEK' | 'KONTEN' | 'KEUANGAN' | 'PERFORMA' | 'NOTES' | 'SHEET' | 'REPORT';
const TABS: { id: Tab; label: string }[] = [
  { id: 'INFO', label: 'Informasi' },
  { id: 'KONTAK', label: 'Kontak' },
  { id: 'PROYEK', label: 'Proyek' },
  { id: 'KONTEN', label: 'Konten' },
  { id: 'KEUANGAN', label: 'Keuangan' },
  { id: 'PERFORMA', label: 'Performa' },
  { id: 'NOTES', label: 'Catatan' },
  { id: 'SHEET', label: 'Sheet Klien' },
  { id: 'REPORT', label: 'Laporan (Docs)' },
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

  if (loading) return <div className="p-8">Memuat data klien...</div>;
  if (!client) return <div className="p-8 text-red-500">Klien tidak ditemukan.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between shrink-0">
        <div>
          <Link href="/clients" className="text-sm text-zinc-500 hover:text-zinc-900 mb-2 inline-block">&larr; Kembali ke Daftar Klien</Link>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-zinc-500 flex items-center gap-2 mt-1">
            {client.industry || 'Tanpa industri'} 
            <span className="w-1 h-1 rounded-full bg-zinc-300"></span> 
            <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-xs font-semibold">{client.status}</span>
          </p>
        </div>
      </div>

      <div className="border-b border-zinc-200 shrink-0 overflow-x-auto">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${activeTab === tab.id 
                  ? 'border-zinc-900 text-zinc-900' 
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {activeTab === 'INFO' && <TabInfo client={client} onUpdate={fetchClient} />}
        {activeTab === 'KONTAK' && <TabContacts clientId={client.id} contacts={client.contacts} onUpdate={fetchClient} />}
        {activeTab === 'PROYEK' && <div className="text-zinc-500">Belum ada data proyek. Modul Proyek akan datang.</div>}
        {activeTab === 'KONTEN' && <div className="text-zinc-500">Belum ada konten untuk klien ini. Navigasi ke halaman Konten untuk membuat konten baru terkait klien ini.</div>}
        {activeTab === 'KEUANGAN' && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-sm text-zinc-500">Total Pendapatan</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{formatIDR(client.totalRevenue || 0)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm text-zinc-500">Retainer Bulanan</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{formatIDR(client.monthlyRetainer || 0)}</div></CardContent>
            </Card>
          </div>
        )}
        {activeTab === 'PERFORMA' && <div className="text-zinc-500">Data performa aggregate konten klien akan tampil di sini.</div>}
        {activeTab === 'NOTES' && <TabNotes clientId={client.id} initialNotes={client.clientNotes} />}
        {activeTab === 'SHEET' && <TabSheet clientId={client.id} />}
        {activeTab === 'REPORT' && <TabReport clientId={client.id} />}
      </div>
    </div>
  );
}

function TabInfo({ client, onUpdate }: { client: any, onUpdate: () => void }) {
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
      onUpdate();
    } else toast.error('Gagal update');
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Edit Informasi Klien</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2"><Label>Nama Klien</Label><Input {...register('name')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Industri</Label><Input {...register('industry')} /></div>
            <div className="space-y-2"><Label>Website</Label><Input {...register('website')} /></div>
          </div>
          <div className="space-y-2"><Label>Retainer Bulanan (Rp)</Label><Input type="number" {...register('monthlyRetainer')} /></div>
          <Button type="submit" disabled={isSubmitting}>Simpan Perubahan</Button>
        </form>
      </CardContent>
    </Card>
  );
}

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
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Batal' : '+ Tambah Kontak'}</Button>
      </div>

      {isOpen && (
        <Card className="border-2 border-zinc-900 animate-in slide-in-from-top-4">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nama</Label><Input {...register('name')} required /></div>
                <div className="space-y-2"><Label>Posisi/Jabatan</Label><Input {...register('position')} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" {...register('email')} /></div>
                <div className="space-y-2"><Label>No. HP</Label><Input {...register('phone')} /></div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPrimary" {...register('isPrimary')} className="w-4 h-4" />
                <Label htmlFor="isPrimary">Jadikan Kontak Utama</Label>
              </div>
              <div className="flex justify-end pt-2 border-t"><Button type="submit">Simpan Kontak</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {contacts.map(c => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold flex items-center gap-2">
                    {c.name} {c.isPrimary && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded uppercase">Utama</span>}
                  </h4>
                  <p className="text-sm text-zinc-500 mb-2">{c.position || 'Tidak ada posisi'}</p>
                </div>
              </div>
              <div className="text-sm space-y-1">
                {c.email && <div>📧 {c.email}</div>}
                {c.phone && <div>📱 {c.phone}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
        {contacts.length === 0 && <div className="col-span-2 text-center text-zinc-500 py-8">Belum ada kontak.</div>}
      </div>
    </div>
  );
}

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
      const newNote = await res.json();
      // Optimistic update using returned data (need to fetch author name ideally, but let's just refetch)
      const resList = await fetch(`/api/clients/${clientId}/notes`);
      if (resList.ok) setNotes(await resList.json());
    } else toast.error('Gagal tambah catatan');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-end">
        <Button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Batal' : '+ Tambah Catatan'}</Button>
      </div>

      {isOpen && (
        <Card className="border-2 border-zinc-900 animate-in slide-in-from-top-4">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2"><Label>Judul</Label><Input {...register('title')} /></div>
              <div className="space-y-2"><Label>Isi Catatan</Label><Textarea {...register('content')} rows={5} /></div>
              <div className="flex justify-end pt-2 border-t"><Button type="submit">Simpan Catatan</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {notes.map(n => (
          <Card key={n.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold">{n.title}</h4>
                <span className="text-xs text-zinc-500">{formatDate(n.createdAt)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{n.content}</p>
              <div className="mt-4 pt-3 border-t text-xs text-zinc-500 text-right">
                Ditulis oleh {n.author?.name || 'Seseorang'}
              </div>
            </CardContent>
          </Card>
        ))}
        {notes.length === 0 && <div className="text-center text-zinc-500 py-8">Belum ada catatan pertemuan/klien.</div>}
      </div>
    </div>
  );
}

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
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Client Progress Sheet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          <p className="text-sm text-zinc-600 mb-4">Buat Google Spreadsheet otomatis yang berisi daftar seluruh konten Klien ini (terjadwal dan sudah dipublikasi) beserta matriks pencapaiannya.</p>
          <div className="space-y-2">
            <Label>Email Klien (Opsional - untuk memberikan akses View)</Label>
            <Input name="email" type="email" placeholder="client@company.com" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Membuat Spreadsheet...' : 'Generate Progress Sheet'}
          </Button>
        </form>
      </CardContent>
    </Card>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Generate Report Bulanan</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label>Periode Bulan</Label>
              <Input name="period" type="month" required />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Memproses...' : 'Generate Report Google Docs'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Riwayat Laporan</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reports.length === 0 ? <p className="text-sm text-zinc-500">Belum ada laporan.</p> : reports.map(r => (
              <a key={r.id} href={r.docUrl} target="_blank" rel="noopener noreferrer" className="block p-3 border rounded hover:bg-zinc-50">
                <p className="font-medium text-sm">{r.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{new Date(r.createdAt).toLocaleDateString('id-ID')}</p>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
