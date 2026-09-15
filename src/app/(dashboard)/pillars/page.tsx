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
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', percentage: 0, color: '#000000', icon: '' }
  });

  const fetchPillars = async () => {
    const res = await fetch('/api/pillars');
    if (res.ok) {
      const data = await res.json();
      setPillars(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPillars();
  }, []);

  const totalPercentage = pillars.reduce((acc, p) => acc + p.percentage, 0);

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
      fetchPillars();
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
      fetchPillars();
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  if (loading) return <div className="p-8">Memuat...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Pilar Konten</h1>
          <p className="text-zinc-500">Kelola kategori dan target pilar konten Anda.</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          reset();
          setIsFormOpen(!isFormOpen);
        }}>
          {isFormOpen ? 'Batal' : '+ Tambah Pillar'}
        </Button>
      </div>

      {totalPercentage !== 100 && pillars.length > 0 && !isFormOpen && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200">
          ⚠️ Total target persentase saat ini adalah <strong>{totalPercentage}%</strong>. Sebaiknya total mencapai 100%.
        </div>
      )}

      {isFormOpen && (
        <Card className="animate-in slide-in-from-top-4 border-2 border-zinc-900">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Pillar</Label>
                  <Input {...register('name')} placeholder="E.g. Edukasi" />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Icon (Emoji)</Label>
                  <Input {...register('icon')} placeholder="🎓" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input {...register('description')} placeholder="Deskripsi singkat" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Persentase (%)</Label>
                  <Input type="number" {...register('percentage')} min="0" max="100" />
                </div>
                <div className="space-y-2">
                  <Label>Warna</Label>
                  <div className="flex gap-2">
                    <Input type="color" {...register('color')} className="w-16 p-1 h-9" />
                    <Input type="text" {...register('color')} className="flex-1" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {pillars.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 bg-zinc-50 rounded-lg border border-dashed">
            Belum ada pillar. Silakan buat baru.
          </div>
        ) : (
          pillars.map((pillar) => (
            <Card key={pillar.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: pillar.color + '20' }}>
                    {pillar.icon || '📌'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pillar.color }} />
                      {pillar.name}
                    </h3>
                    <p className="text-sm text-zinc-500">{pillar.description || 'Tidak ada deskripsi'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden max-w-md">
                        <div className="h-full rounded-full" style={{ width: `${pillar.percentage}%`, backgroundColor: pillar.color }} />
                      </div>
                      <span className="text-xs font-medium text-zinc-600">{pillar.percentage}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(pillar)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(pillar.id)}>Hapus</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
