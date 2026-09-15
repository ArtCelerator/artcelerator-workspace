'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/content/status-badge';
import { ExternalLink, Folder, FileText } from 'lucide-react';
import { MetricsForm } from '@/components/content/metrics-form';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDateShort } from '@/lib/utils';
import Link from 'next/link';

export default function ContentDetailPage({ params }: { params: { id: string } }) {
  const [content, setContent] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContentAndMetrics = async () => {
    const [cRes, mRes] = await Promise.all([
      fetch(`/api/contents/${params.id}`),
      fetch(`/api/contents/${params.id}/metrics`)
    ]);
    if (cRes.ok) setContent(await cRes.json());
    if (mRes.ok) setMetrics(await mRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchContentAndMetrics(); }, [params.id]);

  if (loading) return <div className="p-8">Memuat detail konten...</div>;
  if (!content) return <div className="p-8 text-red-500">Konten tidak ditemukan.</div>;

  const latestMetrics = metrics.length > 0 ? metrics[0] : null;
  const chartData = [...metrics].reverse().map(m => ({
    date: formatDateShort(m.recordedAt),
    engagement: m.likes + m.comments + m.shares,
    reach: m.reach
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex items-start justify-between shrink-0">
        <div>
          <Link href="/contents" className="text-sm text-zinc-500 hover:text-zinc-900 mb-2 inline-block">&larr; Kembali ke Daftar Konten</Link>
          <h1 className="text-3xl font-bold">{content.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={content.status} />
            <span className="text-zinc-500 text-sm">{content.platform} &bull; {content.contentType}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Detail Konten</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div><span className="text-zinc-500 block">Pillar:</span> {content.pillar?.name || '-'}</div>
            <div><span className="text-zinc-500 block">Client:</span> {content.client?.name || '-'}</div>
            <div><span className="text-zinc-500 block">Assigned To:</span> {content.assignedTo?.name || 'Unassigned'}</div>
            <div><span className="text-zinc-500 block">Publish Date:</span> {content.publishDate ? formatDateShort(content.publishDate) : '-'} {content.publishTime || ''}</div>
            <div><span className="text-zinc-500 block">Caption:</span> <p className="whitespace-pre-wrap mt-1 bg-zinc-50 p-2 rounded">{content.caption || 'Belum ada caption'}</p></div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {content.status === 'PUBLISHED' && (
            <MetricsForm contentId={content.id} latestMetrics={latestMetrics} onSuccess={fetchContentAndMetrics} />
          )}

          <Card>
            <CardHeader><CardTitle>Statistik Terakhir</CardTitle></CardHeader>
            <CardContent>
              {latestMetrics ? (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-2xl font-bold">{latestMetrics.likes}</div><div className="text-xs text-zinc-500">Likes</div></div>
                  <div><div className="text-2xl font-bold">{latestMetrics.comments}</div><div className="text-xs text-zinc-500">Comments</div></div>
                  <div><div className="text-2xl font-bold">{latestMetrics.shares}</div><div className="text-xs text-zinc-500">Shares</div></div>
                  <div><div className="text-2xl font-bold">{latestMetrics.reach}</div><div className="text-xs text-zinc-500">Reach</div></div>
                  <div><div className="text-2xl font-bold">{latestMetrics.impressions}</div><div className="text-xs text-zinc-500">Impressions</div></div>
                  <div><div className="text-2xl font-bold">{latestMetrics.views}</div><div className="text-xs text-zinc-500">Views</div></div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Belum ada data metrik tercatat.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>📝 Content Brief</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 items-start">
              <Button onClick={async () => {
                const res = await fetch('/api/docs/templates');
                const templates = await res.json();
                const briefTemp = templates.find((t: any) => t.type === 'brief');
                if (!briefTemp) return alert('Template brief tidak ditemukan. Buat dulu di menu Google Docs.');
                
                const generateRes = await fetch('/api/docs/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ templateId: briefTemp.id, contentId: params.id, clientId: content?.clientId })
                });
                const data = await generateRes.json();
                if (data.docUrl) window.open(data.docUrl, '_blank');
                else alert('Gagal generate brief');
              }}>
                Generate Brief Otomatis
              </Button>
              <p className="text-xs text-zinc-500">Akan membuat Google Doc baru di folder klien berdasarkan template Brief.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Drive Assets */}
      {(content.driveFolders?.length > 0 || content.generatedDocs?.length > 0) && (
        <Card className="mt-6 border-blue-100 shadow-sm">
          <CardHeader className="bg-blue-50/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-500" /> Google Drive Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.driveFolders?.map((f: any) => (
                <a key={f.id} href={f.folderUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <Folder className="w-5 h-5 text-blue-400 fill-blue-100" />
                    <span className="font-medium text-sm text-zinc-700">{f.name}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                </a>
              ))}
              {content.generatedDocs?.map((d: any) => (
                <a key={d.id} href={d.docUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-sm text-zinc-700">{d.title}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>📎 Lampiran & File Tambahan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 border-2 border-dashed border-zinc-300 rounded-lg text-center">
              <input type="file" id="file-upload" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                formData.append('contentId', params.id);
                
                try {
                  const res = await fetch('/api/drive/upload', { method: 'POST', body: formData });
                  if (res.ok) {
                    alert('File berhasil diunggah!');
                    fetchContentAndMetrics();
                  } else {
                    alert('Gagal mengunggah file. Pastikan Google Drive sudah terhubung.');
                  }
                } catch (e) {
                  alert('Terjadi kesalahan.');
                }
              }} />
              <label htmlFor="file-upload" className="cursor-pointer text-blue-600 font-medium hover:underline">
                Klik untuk mengunggah file
              </label>
              <p className="text-xs text-zinc-500 mt-1">Upload ke Google Drive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Perkembangan Performa</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis yAxisId="left" tick={{fontSize: 12}} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="engagement" name="Engagement" stroke="#3b82f6" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="reach" name="Reach" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
