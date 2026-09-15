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
import { Card, CardContent } from '@/components/ui/card';
import { formatIDR, formatDateShort } from '@/lib/utils';
import Link from 'next/link';

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', clientId: '', status: 'PLANNING', budget: 0 }
  });

  const fetchData = async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      fetch(`/api/projects?search=${search}`),
      fetch('/api/clients')
    ]);
    if (pRes.ok) setProjects(await pRes.json());
    if (cRes.ok) setClients(await cRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search]);

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

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center border-b pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Proyek Klien</h1>
          <p className="text-zinc-500">Kelola scope dan deliverable proyek klien.</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>{isFormOpen ? 'Batal' : '+ Buat Proyek'}</Button>
      </div>

      {isFormOpen && (
        <Card className="animate-in slide-in-from-top-4 border-2 border-zinc-900 shrink-0">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Proyek</Label>
                  <Input {...register('name')} />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Klien</Label>
                  <select {...register('clientId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="">-- Pilih Klien --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.clientId && <p className="text-red-500 text-xs">{errors.clientId.message}</p>}
                </div>
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" {...register('startDate')} /></div>
                <div className="space-y-2"><Label>End Date (Deadline)</Label><Input type="date" {...register('endDate')} /></div>
                <div className="space-y-2"><Label>Budget (Rp)</Label><Input type="number" {...register('budget')} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select {...register('status')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi / Scope</Label>
                <Textarea {...register('description')} rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="submit">Simpan Proyek</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="Cari proyek..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="col-span-full text-center text-zinc-500 py-8">Memuat proyek...</p> : projects.map(project => (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <Card className="hover:border-zinc-400 transition-colors cursor-pointer h-full flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight">{project.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">{project.status}</span>
                </div>
                <p className="text-sm text-zinc-500 flex-1">{project.client.name}</p>
                
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs">Deadline</p>
                    <p className="font-medium">{project.endDate ? formatDateShort(project.endDate) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Budget</p>
                    <p className="font-medium text-green-700">{formatIDR(project.budget || 0)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-zinc-500">{project._count.contents} Konten</div>
                  <div className="flex -space-x-2">
                    {project.members.slice(0, 3).map((m: any) => (
                      <div key={m.id} className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-zinc-600">
                        {m.user.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
