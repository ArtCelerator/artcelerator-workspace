'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatIDR } from '@/lib/utils';
import { useSession } from 'next-auth/react';

type Tab = 'AGENSI' | 'KLIEN' | 'PROYEK' | 'TIM' | 'PERSONAL';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const { data: session } = useSession();
  // We assume role is available, but for MVP we just fetch personal if role is EDITOR
  // To keep it simple, we fetch personal and agency. If agency returns 403, it's an EDITOR.
  
  const [activeTab, setActiveTab] = useState<Tab>('AGENSI');
  const [isEditor, setIsEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [agency, setAgency] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const agRes = await fetch('/api/analytics/agency');
      
      if (agRes.status === 403) {
        setIsEditor(true);
        setActiveTab('PERSONAL');
        const pRes = await fetch('/api/analytics/personal');
        if (pRes.ok) setPersonal(await pRes.json());
      } else {
        if (agRes.ok) setAgency(await agRes.json());
        
        const [cRes, pjRes, tRes, pRes] = await Promise.all([
          fetch('/api/analytics/clients'),
          fetch('/api/analytics/projects'),
          fetch('/api/analytics/team'),
          fetch('/api/analytics/personal')
        ]);
        if (cRes.ok) setClients(await cRes.json());
        if (pjRes.ok) setProjects(await pjRes.json());
        if (tRes.ok) setTeam(await tRes.json());
        if (pRes.ok) setPersonal(await pRes.json());
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="p-8">Memuat analitik...</div>;

  const tabs: { id: Tab; label: string }[] = isEditor 
    ? [{ id: 'PERSONAL', label: 'Performa Saya' }]
    : [
        { id: 'AGENSI', label: 'Ringkasan Agensi' },
        { id: 'KLIEN', label: 'Per Klien' },
        { id: 'PROYEK', label: 'Per Proyek' },
        { id: 'TIM', label: 'Performa Tim' },
        { id: 'PERSONAL', label: 'Performa Saya' }
      ];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold">📈 Performa & Analytics</h1>
          <p className="text-zinc-500">Pantau pertumbuhan dan performa konten.</p>
        </div>
      </div>

      <div className="border-b border-zinc-200 shrink-0 overflow-x-auto">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 space-y-6">
        {activeTab === 'AGENSI' && agency && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card><CardHeader><CardTitle className="text-xs text-zinc-500">Total Engagement</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{agency.totalEngagement.toLocaleString('id-ID')}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-xs text-zinc-500">Total Reach</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{agency.totalReach.toLocaleString('id-ID')}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-xs text-zinc-500">Impressions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{agency.totalImpressions.toLocaleString('id-ID')}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-xs text-zinc-500">Growth (vs Bulan Lalu)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">+{agency.growthPct}%</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-xs text-zinc-500">Konten Published</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{agency.totalPublished}</div></CardContent></Card>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="col-span-2">
                <CardHeader><CardTitle>Tren Engagement (12 Minggu)</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={agency.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip />
                      <Line type="monotone" dataKey="engagement" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Platform Dominan</CardTitle></CardHeader>
                <CardContent className="h-72 flex justify-center items-center">
                  {agency.platformCount.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={agency.platformCount} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count">
                          {agency.platformCount.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-zinc-500 text-sm">Belum ada data</p>}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'KLIEN' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Perbandingan Klien</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clients} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" tick={{fontSize: 12}} width={100} />
                    <Tooltip />
                    <Bar dataKey="engagement" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b"><tr><th className="px-4 py-3">Ranking</th><th className="px-4 py-3">Nama Klien</th><th className="px-4 py-3">Total Engagement</th><th className="px-4 py-3">Reach</th><th className="px-4 py-3">Konten</th></tr></thead>
                <tbody>
                  {clients.map((c: any, i: number) => (
                    <tr key={c.id} className="border-b">
                      <td className="px-4 py-3 font-bold text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</td>
                      <td className="px-4 py-3 font-bold">{c.name}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">{c.engagement.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{c.reach.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">{c.contentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'PROYEK' && (
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((p: any) => (
              <Card key={p.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg">{p.name}</h3><span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded">{p.status}</span></div>
                  <p className="text-xs text-zinc-500 mb-4">{p.clientName}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div><p className="text-zinc-500 text-xs">Total Engagement</p><p className="font-bold text-blue-600">{p.engagement.toLocaleString('id-ID')}</p></div>
                    <div><p className="text-zinc-500 text-xs">Budget Terpakai</p><p className="font-bold text-red-600">{formatIDR(p.spent)} / {formatIDR(p.budget)}</p></div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-xs font-bold text-zinc-600">ROI: {p.roi} eng/Rp</div>
                    <div className="text-xs text-zinc-500">{p.publishedCount} / {p.totalContents} Konten Tayang</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'TIM' && (
          <Card>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b"><tr><th className="px-4 py-3">Ranking</th><th className="px-4 py-3">Nama Editor</th><th className="px-4 py-3">Avg Engagement</th><th className="px-4 py-3">Total Konten</th><th className="px-4 py-3">On-Time Rate</th></tr></thead>
              <tbody>
                {team.map((t: any, i: number) => (
                  <tr key={t.id} className="border-b hover:bg-zinc-50">
                    <td className="px-4 py-3 font-bold text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</td>
                    <td className="px-4 py-3 font-bold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs">{t.name.charAt(0)}</div> {t.name}
                    </td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{t.avgEngagement.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">{t.contentCount}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{t.onTimeRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {activeTab === 'PERSONAL' && personal && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardHeader><CardTitle className="text-xs text-zinc-500">Konten Ditugaskan</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{personal.totalContents}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-xs text-zinc-500">Konten Published</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{personal.publishedCount}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-xs text-zinc-500">Avg Engagement</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{personal.avgEngagement.toLocaleString('id-ID')}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-xs text-zinc-500">On-Time Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">95%</div></CardContent></Card>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Breakdown Status</CardTitle></CardHeader>
                <CardContent className="h-64 flex justify-center items-center">
                  {personal.statusCounts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={personal.statusCounts} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}) => `${name} (${value})`}>
                          {personal.statusCounts.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-zinc-500 text-sm">Belum ada konten</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Performa Konten Terakhir</CardTitle></CardHeader>
                <CardContent className="h-64">
                  {personal.performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={personal.performanceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 10}} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip />
                        <Bar dataKey="engagement" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-zinc-500 text-sm text-center pt-20">Belum ada data metrics</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
