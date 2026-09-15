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
import { formatIDR, formatDateShort } from '@/lib/utils';
import Link from 'next/link';
import { DndContext, DragEndEvent, closestCorners, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const CLIENT_STATUSES = ['LEAD', 'PROSPECT', 'ACTIVE', 'PAUSED', 'CHURNED'];
const STATUS_COLORS: Record<string, string> = {
  LEAD: 'bg-zinc-200 text-zinc-800',
  PROSPECT: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CHURNED: 'bg-red-100 text-red-800',
};

const formSchema = z.object({
  name: z.string().min(2, "Minimal 2 karakter"),
  industry: z.string().optional(),
  status: z.enum(['LEAD', 'PROSPECT', 'ACTIVE', 'PAUSED', 'CHURNED']),
  monthlyRetainer: z.coerce.number().optional(),
  website: z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'LIST' | 'PIPELINE'>('LIST');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', industry: '', status: 'LEAD', monthlyRetainer: 0, website: '' }
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

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center border-b pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Klien & CRM</h1>
          <p className="text-zinc-500">Kelola data klien dan prospek Anda.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-zinc-100 p-1 rounded-md flex">
            <button onClick={() => setView('LIST')} className={`px-3 py-1 text-sm rounded-sm font-medium ${view === 'LIST' ? 'bg-white shadow' : 'text-zinc-500 hover:text-zinc-900'}`}>List</button>
            <button onClick={() => setView('PIPELINE')} className={`px-3 py-1 text-sm rounded-sm font-medium ${view === 'PIPELINE' ? 'bg-white shadow' : 'text-zinc-500 hover:text-zinc-900'}`}>Pipeline</button>
          </div>
          <Button onClick={() => setIsFormOpen(!isFormOpen)}>{isFormOpen ? 'Batal' : '+ Tambah Klien'}</Button>
        </div>
      </div>

      {isFormOpen && (
        <Card className="animate-in slide-in-from-top-4 border-2 border-zinc-900 shrink-0">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Klien</Label>
                  <Input {...register('name')} />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Industri</Label>
                  <Input {...register('industry')} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select {...register('status')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Retainer Bulanan (Rp)</Label>
                  <Input type="number" {...register('monthlyRetainer')} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="submit">Simpan Klien</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {view === 'LIST' ? (
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-zinc-50">
            <Input placeholder="Cari klien..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md bg-white" />
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3">Nama Klien</th>
                  <th className="px-4 py-3">Industri</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Proyek & Konten</th>
                  <th className="px-4 py-3">Retainer</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="text-center py-8">Memuat...</td></tr> : clients.map(client => (
                  <tr key={client.id} className="border-b hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{client.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{client.industry || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[client.status]}`}>{client.status}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {client._count.projects} Proyek • {client._count.contents} Konten
                    </td>
                    <td className="px-4 py-3 font-medium">{formatIDR(client.monthlyRetainer || 0)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="sm">Detail</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="flex-1 overflow-hidden">
          <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
              {CLIENT_STATUSES.map(status => (
                <ClientKanbanColumn key={status} id={status} title={status} clients={clients.filter(c => c.status === status)} />
              ))}
            </div>
          </DndContext>
        </div>
      )}
    </div>
  );
}

function ClientKanbanColumn({ id, title, clients }: { id: string, title: string, clients: any[] }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div className="flex flex-col w-72 shrink-0 bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden h-full">
      <div className={`px-4 py-3 border-b flex justify-between items-center bg-white ${isOver ? 'bg-zinc-100' : ''}`}>
        <h3 className="font-semibold text-sm text-zinc-700">{title}</h3>
        <span className="bg-zinc-100 text-zinc-600 text-xs font-bold px-2 py-1 rounded-full">{clients.length}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto space-y-3">
        {clients.map(client => <ClientKanbanCard key={client.id} client={client} />)}
      </div>
    </div>
  );
}

function ClientKanbanCard({ client }: { client: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: client.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="bg-white p-3 rounded-md shadow-sm border border-zinc-200 cursor-grab hover:shadow-md">
      <h4 className="font-bold text-sm text-zinc-900 truncate">{client.name}</h4>
      <p className="text-xs text-zinc-500 mt-1">{client.industry || 'Tanpa industri'}</p>
      <div className="mt-3 flex justify-between items-center">
        <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded">{formatIDR(client.monthlyRetainer || 0)}</span>
        <Link href={`/clients/${client.id}`} className="text-xs text-blue-600 hover:underline" onPointerDown={e => e.stopPropagation()}>Detail &rarr;</Link>
      </div>
    </div>
  );
}
