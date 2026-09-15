'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDateTime, formatDateShort } from '@/lib/utils';
import { ContentStatus, Platform } from '@/lib/constants';

type DashboardData = {
  stats: {
    total: number;
    idea: number;
    drafting: number;
    scheduled: number;
    published: number;
  };
  todayContent: any[];
  overdue: any[];
  upcoming: any[];
  pillarDistribution: any[];
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(res => {
        setData(res);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8">Memuat dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Selamat Datang, {session?.user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-zinc-500 mt-1">Berikut adalah ringkasan konten Anda hari ini.</p>
        </div>
        <Link href="/contents">
          <Button>+ Buat Konten</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Konten</CardTitle>
            <span>📝</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ide</CardTitle>
            <span>💡</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-600">{data?.stats.idea}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafting</CardTitle>
            <span>✍️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data?.stats.drafting}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dijadwalkan</CardTitle>
            <span>📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data?.stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <span>✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{data?.stats.published}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>📌 Konten Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.todayContent.length === 0 ? (
              <p className="text-sm text-zinc-500">Tidak ada konten untuk hari ini.</p>
            ) : (
              <div className="space-y-4">
                {data?.todayContent.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-zinc-500">{item.platform} • {item.publishTime ? new Date(item.publishTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : 'Waktu TBA'}</p>
                    </div>
                    <div className="text-xs font-semibold px-2 py-1 rounded bg-zinc-100">{item.status}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className={data?.overdue.length ? "border-red-200" : ""}>
          <CardHeader>
            <CardTitle className={data?.overdue.length ? "text-red-600" : ""}>⚠️ Overdue</CardTitle>
            <CardDescription>Konten yang melewati batas waktu</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.overdue.length === 0 ? (
              <p className="text-sm text-zinc-500">Bagus! Tidak ada konten yang terlambat.</p>
            ) : (
              <div className="space-y-4">
                {data?.overdue.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-red-600">{item.title}</p>
                      <p className="text-xs text-zinc-500">{item.platform} • {formatDateShort(item.publishDate)}</p>
                    </div>
                    <div className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700">{item.status}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>📅 Upcoming (7 Hari Ke Depan)</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.upcoming.length === 0 ? (
              <p className="text-sm text-zinc-500">Belum ada konten dijadwalkan.</p>
            ) : (
              <div className="space-y-4">
                {data?.upcoming.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-zinc-500">{formatDateShort(item.publishDate)} • {item.platform}</p>
                    </div>
                    <div className="text-xs font-semibold px-2 py-1 rounded bg-zinc-100">{item.status}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🏛️ Distribusi Pillar</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.pillarDistribution.length === 0 ? (
              <p className="text-sm text-zinc-500">Belum ada pillar konten yang dibuat.</p>
            ) : (
              <div className="space-y-4">
                {data?.pillarDistribution.map((pillar) => {
                  const total = data.stats.total || 1;
                  const currentPercentage = Math.round((pillar.count / total) * 100);
                  return (
                    <div key={pillar.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pillar.color }}></span>
                          {pillar.name}
                        </span>
                        <span className="text-zinc-500">{pillar.count} ({currentPercentage}% / Target: {pillar.targetPercentage}%)</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full" 
                          style={{ 
                            width: `${currentPercentage}%`, 
                            backgroundColor: pillar.color 
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Quick Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15%</div>
            <p className="text-xs text-zinc-500 mt-1">Pertumbuhan Engagement vs Bulan Lalu</p>
            <Link href="/analytics" className="text-xs text-blue-600 hover:underline mt-4 inline-block">Lihat laporan lengkap &rarr;</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Platform Teratas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Instagram</div>
            <p className="text-xs text-zinc-500 mt-1">Penyumbang 65% total engagement bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Kinerja Konten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">92%</div>
            <p className="text-xs text-zinc-500 mt-1">On-time delivery rate tim Anda</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
