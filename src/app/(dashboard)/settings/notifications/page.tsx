'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const NOTIF_TYPES = [
  { id: 'CONTENT_ASSIGNED', label: 'Tugas Konten Baru' },
  { id: 'CONTENT_REVIEW_REQUESTED', label: 'Permintaan Review Konten' },
  { id: 'CONTENT_APPROVED', label: 'Konten Disetujui' },
  { id: 'CONTENT_REJECTED', label: 'Konten Direvisi' },
  { id: 'CONTENT_OVERDUE', label: 'Tenggat Waktu Terlewat' },
  { id: 'PAYMENT_RECEIVED', label: 'Pembayaran Diterima' }
];

export default function NotificationsSettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');

  const fetchSettings = async () => {
    const res = await fetch('/api/settings/notifications');
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/telegram/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    if (res.ok) {
      toast.success('Telegram berhasil dihubungkan!');
      setCode('');
      fetchSettings();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Gagal menghubungkan');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Putuskan koneksi Telegram?')) return;
    setLoading(true);
    const res = await fetch('/api/settings/notifications', { method: 'DELETE' });
    if (res.ok) {
      toast.success('Koneksi diputus');
      fetchSettings();
    }
  };

  const togglePref = async (type: string, field: 'inAppEnabled' | 'telegramEnabled', currentValue: boolean) => {
    const pref = data.preferences.find((p: any) => p.type === type) || { inAppEnabled: true, telegramEnabled: true };
    
    // Optimistic update
    const newPrefs = [...data.preferences];
    const idx = newPrefs.findIndex((p: any) => p.type === type);
    if (idx >= 0) newPrefs[idx][field] = !currentValue;
    else newPrefs.push({ type, inAppEnabled: true, telegramEnabled: true, [field]: !currentValue });
    setData({ ...data, preferences: newPrefs });

    await fetch('/api/settings/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, inAppEnabled: pref.inAppEnabled, telegramEnabled: pref.telegramEnabled, [field]: !currentValue })
    });
  };

  if (loading && !data) return <div className="p-8">Memuat...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🔔 Pengaturan Notifikasi</h1>
      
      <Card className={data?.telegramConnected ? 'border-blue-200' : ''}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center p-2 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </div>
            <div>
              <CardTitle>Notifikasi Telegram</CardTitle>
              <CardDescription>Terima notifikasi real-time langsung ke WhatsApp/Telegram Anda.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data?.telegramConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">✅ TERHUBUNG</span>
                <span className="text-sm font-medium">Chat ID: {data.telegramChatId}</span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>Putuskan Koneksi</Button>
            </div>
          ) : (
            <div className="space-y-4 bg-zinc-50 p-4 rounded-md border">
              <h3 className="font-semibold text-sm">Cara Menghubungkan:</h3>
              <ol className="list-decimal pl-5 text-sm space-y-1 text-zinc-600">
                <li>Buka aplikasi Telegram</li>
                <li>Cari bot kami: <strong>@ContentPlannerBot</strong></li>
                <li>Kirim pesan <strong>/start</strong> ke bot tersebut</li>
                <li>Salin 6 digit kode yang diberikan bot, lalu masukkan di bawah ini:</li>
              </ol>
              <form onSubmit={handleConnect} className="flex gap-2 max-w-sm mt-4">
                <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Contoh: 123456" required maxLength={6} />
                <Button type="submit" disabled={loading}>Connect</Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferensi Notifikasi</CardTitle>
          <CardDescription>Pilih notifikasi apa saja yang ingin Anda terima.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Jenis Notifikasi</th>
                  <th className="px-4 py-3 text-center font-medium">In-App 🔔</th>
                  <th className="px-4 py-3 text-center font-medium">Telegram 📱</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {NOTIF_TYPES.map(t => {
                  const pref = data?.preferences?.find((p: any) => p.type === t.id) || { inAppEnabled: true, telegramEnabled: true };
                  return (
                    <tr key={t.id} className="bg-white">
                      <td className="px-4 py-3">{t.label}</td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={pref.inAppEnabled} onChange={() => togglePref(t.id, 'inAppEnabled', pref.inAppEnabled)} className="w-4 h-4 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={pref.telegramEnabled} onChange={() => togglePref(t.id, 'telegramEnabled', pref.telegramEnabled)} disabled={!data?.telegramConnected} className="w-4 h-4 cursor-pointer" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🌙 Waktu Tenang (Quiet Hours)</CardTitle>
          <CardDescription>Notifikasi Telegram akan ditunda pada jam istirahat.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 text-amber-800 p-4 rounded-md border border-amber-200 text-sm">
            <strong>Berlaku Pukul 22:00 - 07:00</strong><br />
            Selama jam istirahat, seluruh notifikasi Telegram akan ditahan (queued) agar tidak mengganggu Anda, dan akan dikirimkan sekaligus pada pukul 08:00 pagi setiap harinya.<br />
            <em>Notifikasi In-App (lonceng) akan tetap masuk secara real-time.</em>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
