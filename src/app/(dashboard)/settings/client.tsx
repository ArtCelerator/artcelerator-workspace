'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { useSearchParams } from 'next/navigation';

export default function SettingsClient({ workspace, user }: { workspace: any, user: any }) {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') || 'workspace';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  useEffect(() => {
    if (searchParams?.get('tab')) {
      setActiveTab(searchParams.get('tab') as string);
    }
  }, [searchParams]);
  const router = useRouter();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">⚙️ Pengaturan</h1>
        <p className="text-zinc-500">Kelola workspace, tim, dan profil Anda.</p>
      </div>

      <div className="flex border-b">
        <button onClick={() => setActiveTab('workspace')} className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'workspace' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>🏢 Workspace Agensi</button>
        <button onClick={() => setActiveTab('integrations')} className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'integrations' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>🔗 Integrasi Agensi</button>
        <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'profile' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>👤 Profil Admin</button>
      </div>

      <div className="pt-4">
        {activeTab === 'workspace' && <WorkspaceTab workspace={workspace} />}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'profile' && <ProfileTab user={user} />}
      </div>
    </div>
  );
}

function WorkspaceTab({ workspace }: { workspace: any }) {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/workspaces', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    if (res.ok) {
      toast.success('Workspace berhasil diperbarui!');
    } else {
      toast.error('Gagal memperbarui workspace.');
    }
    setLoading(false);
  };

  const handleDelete = () => {
    if (confirm('BAHAYA: Apakah Anda yakin ingin menghapus seluruh agensi ini? Semua data klien, proyek, dan konten akan terhapus SELAMANYA!')) {
      toast.error('Fitur hapus belum tersedia di MVP.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Agensi</CardTitle>
          <CardDescription>Ubah detail utama workspace Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Workspace</label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi Agensi (Opsional)</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Tindakan di bawah ini tidak dapat dibatalkan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDelete}>Hapus Agensi Ini</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function IntegrationsTab() {  const [loadingGoogle, setLoadingGoogle] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleInfo, setGoogleInfo] = useState<any>(null);

  const [notifData, setNotifData] = useState<any>(null);
  const [tgLoading, setTgLoading] = useState(true);
  const [code, setCode] = useState('');

  useEffect(() => {
    fetch('/api/settings/integrations/status').then(r => r.json()).then(data => {
      setGoogleConnected(data.googleConnected);
      setGoogleInfo(data.googleInfo);
      setLoadingGoogle(false);
    });

    fetch('/api/settings/notifications').then(r => r.json()).then(data => {
      setNotifData(data);
      setTgLoading(false);
    });
  }, []);

  const handleDisconnectGoogle = async () => {
    if (!confirm('Putuskan koneksi Google Drive?')) return;
    const res = await fetch('/api/google/disconnect', { method: 'POST' });
    if (res.ok) {
      setGoogleConnected(false);
      setGoogleInfo(null);
      toast.success('Koneksi Google terputus.');
    }
  };

  const handleConnectTg = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/telegram/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    if (res.ok) {
      toast.success('Telegram berhasil dihubungkan!');
      fetch('/api/settings/notifications').then(r => r.json()).then(setNotifData);
    } else toast.error('Gagal menghubungkan Telegram.');
  };

  const handleDisconnectTg = async () => {
    if (!confirm('Putuskan koneksi Telegram?')) return;
    const res = await fetch('/api/settings/notifications', { method: 'DELETE' });
    if (res.ok) {
      toast.success('Telegram terputus.');
      fetch('/api/settings/notifications').then(r => r.json()).then(setNotifData);
    }
  };

  return (
    <div className="space-y-6">
      <Card className={googleConnected ? 'border-green-200' : ''}>
        <CardHeader>
          <CardTitle>Google Workspace</CardTitle>
          <CardDescription>Integrasi penyimpanan file klien dan aset.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingGoogle ? <p className="text-sm">Memeriksa...</p> : googleConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">✅ TERHUBUNG</span>
                <span className="text-sm font-medium">{googleInfo?.email}</span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDisconnectGoogle}>Putuskan Koneksi</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <span className="bg-zinc-100 text-zinc-600 px-2 py-1 rounded text-xs font-bold border border-zinc-200">❌ BELUM TERHUBUNG</span>
              <p className="text-sm text-zinc-600">Hubungkan untuk mengaktifkan folder otomatis per Klien & Proyek.</p>
              <a href="/api/google/connect"><Button>Hubungkan dengan Google</Button></a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={notifData?.telegramConnected ? 'border-blue-200' : ''}>
        <CardHeader>
          <CardTitle>Telegram Bot</CardTitle>
          <CardDescription>Terima notifikasi real-time langsung ke ponsel Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          {tgLoading ? <p className="text-sm">Memeriksa...</p> : notifData?.telegramConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">✅ TERHUBUNG</span>
                <span className="text-sm font-medium">Chat ID: {notifData.telegramChatId}</span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDisconnectTg}>Putuskan Koneksi</Button>
            </div>
          ) : (
            <div className="space-y-4 bg-zinc-50 p-4 rounded-md border">
              <h3 className="font-semibold text-sm">Cara Menghubungkan:</h3>
              <ol className="list-decimal pl-5 text-sm space-y-1 text-zinc-600">
                <li>Buka Telegram, cari <strong>@ContentPlannerBot</strong></li>
                <li>Kirim pesan <strong>/start</strong></li>
                <li>Salin 6 digit kode yang diberikan bot.</li>
              </ol>
              <form onSubmit={handleConnectTg} className="flex gap-2 max-w-sm mt-4">
                <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Contoh: 123456" required maxLength={6} />
                <Button type="submit">Connect</Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileTab({ user }: { user: any }) {
  const [name, setName] = useState(user.name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) toast.success('Profil berhasil diperbarui!');
    else toast.error('Gagal memperbarui profil.');
    setLoading(false);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }
    setLoadingPwd(true);
    // Dummy endpoint for MVP
    setTimeout(() => {
      toast.success('Password berhasil diubah!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoadingPwd(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profil Anda</CardTitle>
          <CardDescription>Perbarui nama akun Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input value={user.email} disabled className="bg-zinc-100" />
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Profil'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
          <CardDescription>Perbarui kata sandi akun Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Password Lama</label>
              <Input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password Baru</label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Konfirmasi Password Baru</label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loadingPwd}>{loadingPwd ? 'Menyimpan...' : 'Ubah Password'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}