'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR, formatDate } from '@/lib/utils';
import Link from 'next/link';

type Tab = 'OVERVIEW' | 'KONTEN' | 'TEAM' | 'KEUANGAN';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${params.id}`);
    if (res.ok) setProject(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchProject(); }, [params.id]);

  if (loading) return <div className="p-8">Memuat proyek...</div>;
  if (!project) return <div className="p-8 text-red-500">Proyek tidak ditemukan.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex items-start justify-between shrink-0">
        <div>
          <Link href="/projects" className="text-sm text-zinc-500 hover:text-zinc-900 mb-2 inline-block">&larr; Kembali ke Proyek</Link>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-zinc-500 flex items-center gap-2 mt-1">
            <Link href={`/clients/${project.client.id}`} className="hover:underline text-blue-600">{project.client.name}</Link>
            <span className="w-1 h-1 rounded-full bg-zinc-300"></span> 
            <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-xs font-semibold">{project.status}</span>
          </p>
        </div>
      </div>

      <div className="border-b border-zinc-200 shrink-0 overflow-x-auto">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {(['OVERVIEW', 'KONTEN', 'TEAM', 'KEUANGAN'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${activeTab === tab ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'}
              `}
            >
              {tab === 'OVERVIEW' ? 'Overview' : tab === 'KONTEN' ? 'Konten' : tab === 'TEAM' ? 'Tim' : 'Keuangan'}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card><CardHeader><CardTitle className="text-sm text-zinc-500">Budget</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-700">{formatIDR(project.budget || 0)}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm text-zinc-500">Mulai</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{project.startDate ? formatDate(project.startDate) : '-'}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm text-zinc-500">Tenggat Waktu</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-red-600">{project.endDate ? formatDate(project.endDate) : '-'}</div></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Deskripsi Proyek</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm text-zinc-700">{project.description || 'Tidak ada deskripsi.'}</p></CardContent>
            </Card>
          </div>
        )}
        {activeTab === 'KONTEN' && (
          <div className="space-y-4">
            {project.contents.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{c.title}</h4>
                    <p className="text-xs text-zinc-500">Status: {c.status} &bull; Platform: {c.platform}</p>
                  </div>
                  <Link href={`/contents?search=${c.title}`}><Button variant="outline" size="sm">Lihat Detail</Button></Link>
                </CardContent>
              </Card>
            ))}
            {project.contents.length === 0 && <p className="text-zinc-500">Belum ada konten terkait proyek ini.</p>}
          </div>
        )}
        {activeTab === 'TEAM' && (
          <div className="grid md:grid-cols-2 gap-4">
            {project.members.map((m: any) => (
              <Card key={m.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-bold">{m.user.name.charAt(0)}</div>
                    <div>
                      <h4 className="font-bold">{m.user.name}</h4>
                      <p className="text-xs text-zinc-500">{m.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {activeTab === 'KEUANGAN' && (
          <div className="text-zinc-500">Modul Invoice dan Expense untuk proyek ini. Buka halaman Keuangan utama untuk detail lengkap.</div>
        )}
      </div>
    </div>
  );
}
