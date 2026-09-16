'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(2, "Minimal 2 karakter"),
  description: z.string().optional(),
  percentage: z.coerce.number().min(0).max(100),
  color: z.string(),
  icon: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PillarsPage() {
  const [pillars, setPillars] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', percentage: 0, color: '#1b52d6', icon: '' }
  });

  const fetchData = async () => {
    try {
      const [resPillars, resTags] = await Promise.all([
        fetch('/api/pillars'),
        fetch('/api/tags')
      ]);
      
      if (resPillars.ok) {
        setPillars(await resPillars.json());
      }
      if (resTags.ok) {
        setTags(await resTags.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPercentage = pillars.reduce((acc, p) => acc + (p.percentage || 0), 0);
  const totalContents = pillars.reduce((acc, p) => acc + (p.contents?.length || 0), 0);

  const onSubmit = async (data: any) => {
    try {
      const url = editingId ? `/api/pillars/${editingId}` : '/api/pillars';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('Gagal menyimpan pillar');

      toast.success('Pillar berhasil disimpan');
      setIsFormOpen(false);
      setEditingId(null);
      reset();
      fetchData();
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleEdit = (pillar: any) => {
    setEditingId(pillar.id);
    setValue('name', pillar.name);
    setValue('description', pillar.description || '');
    setValue('percentage', pillar.percentage);
    setValue('color', pillar.color);
    setValue('icon', pillar.icon || '');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pillar ini?')) return;
    try {
      const res = await fetch(`/api/pillars/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Pillar dihapus');
      fetchData();
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  if (loading) return <div className="pt-6 min-h-screen bg-zinc-50 flex justify-center"><div className="animate-pulse text-zinc-500 pt-10">Memuat data...</div></div>;

  return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full">
      <div className="flex flex-col w-full p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Top Meta & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">STRATEGI & TAKSONOMI KONTEN</span>
              <span className="text-zinc-300">•</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase">v2.4 Live Sync</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-3xl text-zinc-900 tracking-tight font-bold">🏛️ Pilar Konten & Tag</h1>
            </div>
            <p className="text-sm text-zinc-500">
              Atur strategi distribusi pilar konten dan perpustakaan hashtag agensi Anda.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 shadow-sm transition-all" type="button">
              <span className="material-symbols-outlined text-[18px] text-zinc-400">file_download</span>
              <span>Ekspor Taksonomi</span>
            </button>
            <button onClick={() => { setEditingId(null); reset(); setIsFormOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 shadow-sm transition-all" type="button">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Tambah Pilar</span>
            </button>
          </div>
        </div>

        {/* Advisory / Warning Banner */}
        {totalPercentage !== 100 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-800 font-bold">⚠️</div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-amber-950">
                  Total distribusi pilar saat ini: {totalPercentage}% <span className="font-normal text-amber-800">({totalPercentage < 100 ? `Kurang ${100 - totalPercentage}%` : `Lebih ${totalPercentage - 100}%`})</span>
                </p>
                <p className="text-xs text-amber-800">
                  Sesuaikan persentase pilar agar mencapai target 100% ideal demi konsistensi algoritma dan retensi audiens.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-colors" type="button" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>
                Sesuaikan Persentase
              </button>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 border-0 rounded-2xl overflow-hidden">
              <div className="bg-white px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
                <h3 className="font-semibold text-lg">{editingId ? 'Edit Pilar Konten' : 'Buat Pilar Baru'}</h3>
                <button onClick={() => setIsFormOpen(false)} className="text-zinc-400 hover:text-zinc-900"><span className="material-symbols-outlined">close</span></button>
              </div>
              <CardContent className="p-6 bg-zinc-50">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-700">Nama Pilar</Label>
                      <Input {...register('name')} placeholder="E.g. Edukasi" className="bg-white" />
                      {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-700">Icon (Emoji)</Label>
                      <Input {...register('icon')} placeholder="🎓" className="bg-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700">Deskripsi Singkat</Label>
                    <Input {...register('description')} placeholder="Tujuan pilar ini..." className="bg-white" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-700">Target Persentase (%)</Label>
                      <Input type="number" {...register('percentage')} min="0" max="100" className="bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-700">Warna Identitas</Label>
                      <div className="flex gap-2">
                        <Input type="color" {...register('color')} className="w-12 p-1 h-9 bg-white cursor-pointer" />
                        <Input type="text" {...register('color')} className="flex-1 bg-white font-mono text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-zinc-200">
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="bg-white">Batal</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Simpan Pilar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Overall Distribution Summary Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">📊 Distribusi Pilar Keseluruhan</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 font-mono text-zinc-500 tracking-wider">TARGET AKTIF</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-50 text-zinc-600 text-[10px] font-bold tracking-wider border border-zinc-200 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span>{pillars.length} Pilar Terdaftar • Total {totalContents} Konten Aktif</span>
            </div>
          </div>
          
          {/* Horizontal Stacked Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-4 rounded-full overflow-hidden flex bg-zinc-100 shadow-inner">
              {pillars.map((pillar) => (
                <div key={pillar.id} className="transition-all duration-500 hover:opacity-90 relative group" style={{ width: `${pillar.percentage}%`, backgroundColor: pillar.color }} title={`${pillar.name}: ${pillar.percentage}%`}></div>
              ))}
            </div>
            <div className="flex justify-between items-center text-right text-[10px] font-bold text-zinc-500 pt-0.5 uppercase tracking-wider">
              <span>Kapasitas Digunakan: {totalPercentage}%</span>
              {totalPercentage < 100 && <span className="text-amber-600">+{100 - totalPercentage}% Cadangan / Alokasi Baru</span>}
              {totalPercentage > 100 && <span className="text-red-600">Overkapasitas {totalPercentage - 100}%</span>}
            </div>
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-zinc-100">
            {pillars.map((pillar) => (
              <div key={pillar.id} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pillar.color }}></span>
                <span className="truncate"><strong className="text-zinc-900 font-medium">{pillar.name}</strong> ({pillar.percentage}% • {pillar.contents?.length || 0})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pillars List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-900">Rincian Pilar Aktif</h3>
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">URUTAN BERDASARKAN BOBOT STRATEGIS</span>
          </div>
          
          {pillars.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-zinc-300">
              <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">category</span>
              <p className="text-zinc-500 font-medium text-sm">Belum ada pilar konten. Silakan buat yang pertama.</p>
            </div>
          ) : (
            pillars.map((pillar) => {
              // Hitung statistik
              const contentCount = pillar.contents?.length || 0;
              const uniqueClients = new Set(pillar.contents?.filter((c:any) => c.client?.id).map((c:any) => c.client.id));
              let lastUsed = 'Belum pernah';
              if (contentCount > 0) {
                const dates = pillar.contents.map((c:any) => new Date(c.updatedAt).getTime());
                const maxDate = new Date(Math.max(...dates));
                const diffDays = Math.floor((new Date().getTime() - maxDate.getTime()) / (1000 * 3600 * 24));
                lastUsed = diffDays === 0 ? 'Hari ini' : diffDays === 1 ? 'Kemarin' : `${diffDays} hari lalu`;
              }
              
              return (
                <div key={pillar.id} className="bg-white border border-zinc-200 rounded-xl p-5 lg:p-6 hover:border-zinc-300 hover:shadow-md transition-all group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="w-3 h-3 rounded-full ring-4" style={{ backgroundColor: pillar.color, boxShadow: `0 0 0 4px ${pillar.color}20` }}></span>
                      <span className="text-xl text-zinc-900 font-semibold">{pillar.name}</span>
                      {pillar.icon && (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wider uppercase" style={{ backgroundColor: `${pillar.color}15`, color: pillar.color, border: `1px solid ${pillar.color}30` }}>
                          {pillar.icon} {pillar.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight" style={{ color: pillar.color }}>{pillar.percentage}%</span>
                      <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">TARGET</span>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
                    {pillar.description || 'Tidak ada deskripsi.'}
                  </p>
                  
                  {/* Progress bar individual */}
                  <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pillar.percentage}%`, backgroundColor: pillar.color }}></div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-zinc-900">{contentCount} konten dibuat</span>
                      <span className="text-zinc-300">•</span>
                      <span>Terakhir digunakan: {lastUsed}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="inline-flex items-center gap-1 font-medium" style={{ color: pillar.color }}>
                        <span className="material-symbols-outlined text-[14px]">store</span> {uniqueClients.size} Brand aktif
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 self-end md:self-auto">
                      <button onClick={() => handleEdit(pillar)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors" title="Edit Pilar">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(pillar.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors" title="Hapus Pilar">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tags & Hashtag Library Section */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-zinc-900">🏷️ Perpustakaan Tag & Hashtag</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-50 border border-zinc-200 text-zinc-500 tracking-wider uppercase">{tags.length} Preset</span>
              </div>
              <p className="text-sm text-zinc-500">
                Kelola kelompok hashtag terverifikasi untuk caption otomatis dan tracking performa topik.
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-all self-start sm:self-auto shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-blue-600">add</span>
              <span>Tambah Tag Kustom</span>
            </button>
          </div>
          
          {/* Categories Grid (Simplified for UI representation based on mock) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Brand Tags */}
            <div className="bg-zinc-50/70 rounded-xl p-4 border border-zinc-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold tracking-wider uppercase">
                    Brand Tags
                  </span>
                  <span className="font-mono text-xs text-zinc-400">4 Tags</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {['#kopinusantara', '#skincareglow', '#sportbrandindo', '#artcelerator'].map((t) => (
                    <div key={t} className="flex items-center justify-between p-1.5 px-3 rounded-lg bg-white border border-zinc-200 hover:border-blue-300 transition-colors group">
                      <span className="font-mono text-xs font-medium text-zinc-900">{t}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{Math.floor(Math.random() * 50) + 1}x</span>
                        <button className="text-zinc-300 hover:text-blue-600 transition-colors flex items-center" onClick={() => { navigator.clipboard?.writeText(t); toast.success('Disalin!'); }} title="Salin">
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full py-1.5 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 flex items-center justify-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[14px]">copy_all</span>
                <span>Salin Set Tag Brand</span>
              </button>
            </div>

            {/* Column 2: Niche & Industry Tags */}
            <div className="bg-zinc-50/70 rounded-xl p-4 border border-zinc-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold tracking-wider uppercase">
                    Niche & Industry
                  </span>
                  <span className="font-mono text-xs text-zinc-400">5 Tags</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {['#specialtycoffee', '#skincareroutine', '#tipskopi', '#cleanskincare', '#coffeeroastery'].map((t) => (
                    <div key={t} className="flex items-center justify-between p-1.5 px-3 rounded-lg bg-white border border-zinc-200 hover:border-emerald-300 transition-colors group">
                      <span className="font-mono text-xs font-medium text-zinc-900">{t}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{Math.floor(Math.random() * 20) + 1}x</span>
                        <button className="text-zinc-300 hover:text-emerald-600 transition-colors flex items-center" onClick={() => { navigator.clipboard?.writeText(t); toast.success('Disalin!'); }} title="Salin">
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full py-1.5 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 flex items-center justify-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[14px]">copy_all</span>
                <span>Salin Set Niche</span>
              </button>
            </div>

            {/* Column 3: Trending & Discovery Tags */}
            <div className="bg-zinc-50/70 rounded-xl p-4 border border-zinc-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold tracking-wider uppercase">
                    Trending & Discovery
                  </span>
                  <span className="font-mono text-xs text-zinc-400">4 Tags</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {['#fyp', '#ngopidulu', '#beautyhacks', '#reelsviral'].map((t) => (
                    <div key={t} className="flex items-center justify-between p-1.5 px-3 rounded-lg bg-white border border-zinc-200 hover:border-purple-300 transition-colors group">
                      <span className="font-mono text-xs font-medium text-zinc-900">{t}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{Math.floor(Math.random() * 50) + 1}x</span>
                        <button className="text-zinc-300 hover:text-purple-600 transition-colors flex items-center" onClick={() => { navigator.clipboard?.writeText(t); toast.success('Disalin!'); }} title="Salin">
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full py-1.5 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 flex items-center justify-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[14px]">copy_all</span>
                <span>Salin Set Trending</span>
              </button>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-100">
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
              <span className="material-symbols-outlined text-[18px] text-blue-600">auto_fix_high</span>
              <span>Caption Generator otomatis mengombinasikan 1 Brand Tag + 2 Niche Tags + 2 Discovery Tags.</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button className="px-4 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors" type="button">
                Salin Semua Tag Kategori
              </button>
              <button className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shadow-sm" type="button">
                <span className="material-symbols-outlined text-[16px]">folder_open</span>
                <span>Buat Grup Hashtag Baru</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
