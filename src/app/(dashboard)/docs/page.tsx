'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DocsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      const res = await fetch('/api/docs');
      if (res.ok) setDocs(await res.json());
      setLoading(false);
    };
    fetchDocs();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold">📄 Dokumen (Google Docs)</h1>
          <p className="text-zinc-500">Riwayat dokumen yang digenerate otomatis.</p>
        </div>
        <Link href="/docs/templates">
          <Button variant="outline">⚙️ Kelola Template</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <p>Memuat...</p>
        ) : docs.length === 0 ? (
          <p className="text-zinc-500">Belum ada dokumen yang dibuat.</p>
        ) : docs.map(d => (
          <Card key={d.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg leading-tight">{d.title}</CardTitle>
              </div>
              <CardDescription>{new Date(d.createdAt).toLocaleDateString('id-ID')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono border">{d.type}</span>
              <a href={d.docUrl} target="_blank" rel="noopener noreferrer" className="block mt-4">
                <Button className="w-full" variant="secondary">Buka Dokumen</Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
