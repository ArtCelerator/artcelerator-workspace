'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/content/status-badge';
import { PriorityBadge } from '@/components/content/priority-badge';
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

type FormData = z.infer<typeof formSchema>;

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

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '', contentType: 'SOCIAL_POST', platform: 'INSTAGRAM',
      pillarId: '', clientId: '', publishDate: '', publishTime: '', priority: 'MEDIUM', caption: '', notes: ''
    }
  });

  useEffect(() => {
    // Read query params from URL (without next/navigation to keep it simple, or use URLSearchParams)
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
  }, [search, statusFilter, platformFilter]);

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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Konten</h1>
          <p className="text-zinc-500">Kelola dan jadwalkan semua konten Anda di sini.</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          reset();
          setIsFormOpen(!isFormOpen);
        }}>
          {isFormOpen ? 'Batal' : '+ Buat Konten'}
        </Button>
      </div>

      {isFormOpen && (
        <Card className="animate-in slide-in-from-top-4 border-2 border-zinc-900">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Judul Konten</Label>
                  <Input {...register('title')} placeholder="Judul..." />
                  {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Tipe Konten</Label>
                  <select {...register('contentType')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    {Object.entries(CONTENT_TYPE_INFO).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <select {...register('platform')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    {Object.entries(PLATFORM_INFO).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Pilar Konten</Label>
                  <select {...register('pillarId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="">-- Pilih Pillar --</option>
                    {pillars.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Publish</Label>
                  <Input type="date" {...register('publishDate')} />
                </div>
                <div className="space-y-2">
                  <Label>Jam Publish</Label>
                  <Input type="time" {...register('publishTime')} />
                </div>
                <div className="space-y-2">
                  <Label>Prioritas</Label>
                  <select {...register('priority')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea {...register('caption')} placeholder="Tulis caption di sini..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Catatan (Internal)</Label>
                <Input {...register('notes')} placeholder="Catatan tim..." />
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                <Button type="submit">Simpan Konten</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center bg-zinc-50 border-b">
          <div className="flex-1 w-full">
            <Input 
              placeholder="🔍 Cari judul konten..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-9 w-full md:w-40 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select 
              value={platformFilter} 
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="flex h-9 w-full md:w-40 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Semua Platform</option>
              {Object.entries(PLATFORM_INFO).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => { setSearch(''); setStatusFilter(''); setPlatformFilter(''); }}>Reset</Button>
          </div>
        </CardContent>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b">
              <tr>
                <th className="px-4 py-3">Konten</th>
                <th className="px-4 py-3">Jadwal Publish</th>
                <th className="px-4 py-3">Prioritas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">Memuat...</td></tr>
              ) : contents.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-zinc-500">Tidak ada konten ditemukan.</td></tr>
              ) : (
                contents.map((item) => {
                  const plat = PLATFORM_INFO[item.platform as Platform];
                  const typeInfo = CONTENT_TYPE_INFO[item.contentType as ContentType];
                  
                  return (
                    <tr key={item.id} className="border-b hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-900 flex items-center gap-2">
                          <span title={plat?.label}>{plat?.icon}</span>
                          {item.title}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                          <span>{typeInfo?.icon} {typeInfo?.label}</span>
                          {item.pillar && (
                            <>
                              <span className="mx-1">•</span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.pillar.color }}></span>
                                {item.pillar.name}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {item.publishDate ? formatDateShort(item.publishDate) : '-'}
                        {item.publishTime ? `, ${item.publishTime}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-right flex justify-end gap-2 items-center">
                        <select 
                          className="h-8 text-xs rounded border-zinc-200 bg-white px-2 cursor-pointer"
                          value={item.status}
                          onChange={(e) => handleChangeStatus(item.id, e.target.value)}
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <Link href={`/contents/${item.id}`} className="text-blue-600 hover:underline text-sm px-2">Detail</Link>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(item.id)}>Hapus</Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
