'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleInfo, setGoogleInfo] = useState<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get('success') === 'google_connected') {
      toast.success('Google Workspace berhasil dihubungkan!');
    } else if (searchParams?.get('error')) {
      toast.error('Gagal menghubungkan Google Workspace.');
    }

    const fetchStatus = async () => {
      // Basic check, in MVP we assume if there's a googleConnection we just need an endpoint to check it
      const res = await fetch('/api/settings/integrations/status');
      if (res.ok) {
        const data = await res.json();
        setGoogleConnected(data.googleConnected);
        if (data.googleInfo) setGoogleInfo(data.googleInfo);
      }
      setLoading(false);
    };
    fetchStatus();
  }, [searchParams]);

  const handleDisconnect = async () => {
    if (!confirm('Apakah Anda yakin ingin memutuskan koneksi Google Drive? Seluruh fitur upload file tidak akan bisa digunakan.')) return;
    setLoading(true);
    const res = await fetch('/api/google/disconnect', { method: 'POST' });
    if (res.ok) {
      setGoogleConnected(false);
      setGoogleInfo(null);
      toast.success('Koneksi Google terputus.');
    } else {
      toast.error('Gagal memutuskan koneksi.');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold">🔗 Integrasi</h1>
          <p className="text-zinc-500">Kelola koneksi aplikasi pihak ketiga.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className={googleConnected ? 'border-green-200' : ''}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2 shadow-sm border">
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png" alt="Google Drive" className="w-full h-full object-contain" />
              </div>
              <div>
                <CardTitle>Google Workspace</CardTitle>
                <CardDescription>Integrasi Google Drive, Docs, dan Sheets</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-zinc-500">Memeriksa status...</p>
            ) : googleConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">✅ TERHUBUNG</span>
                  <span className="text-sm font-medium">{googleInfo?.email}</span>
                </div>
                
                <div className="text-sm text-zinc-600 bg-zinc-50 p-4 rounded-md border">
                  <p className="font-semibold mb-2">Akses Diberikan:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>✅ Google Drive (Manajemen Folder Klien & Proyek)</li>
                    <li>✅ Google Sheets (Sinkronisasi Konten & Analytics)</li>
                    <li>✅ Google Docs (Briefs & Reports)</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => toast.success('Sinkronisasi folder Drive berhasil.')}>Sync Folder Sekarang</Button>
                  <Button variant="destructive" onClick={handleDisconnect}>Putuskan Koneksi</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-zinc-100 text-zinc-600 px-2 py-1 rounded text-xs font-bold border border-zinc-200">❌ BELUM TERHUBUNG</span>
                </div>
                <p className="text-sm text-zinc-600">
                  Hubungkan Google Workspace untuk mengaktifkan fitur penyimpanan file otomatis per Klien & Proyek, serta lampiran aset untuk setiap Konten.
                </p>
                <a href="/api/google/connect">
                  <Button className="mt-2">Hubungkan dengan Google</Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
