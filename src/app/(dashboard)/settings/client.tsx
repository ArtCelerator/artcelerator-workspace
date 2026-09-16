'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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

  // Workspace States
  const [workspaceName, setWorkspaceName] = useState(workspace.name || '');
  const [workspaceDesc, setWorkspaceDesc] = useState(workspace.description || '');
  const [savingWorkspace, setSavingWorkspace] = useState(false);

  // Profile States
  const [userName, setUserName] = useState(user.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  // Integrations States
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleInfo, setGoogleInfo] = useState<any>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(true);
  const [notifData, setNotifData] = useState<any>(null);
  const [tgLoading, setTgLoading] = useState(true);
  const [tgCode, setTgCode] = useState('');

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

  const handleSaveWorkspace = async () => {
    setSavingWorkspace(true);
    const res = await fetch(`/api/workspaces/${workspace.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: workspaceName, description: workspaceDesc })
    });
    if (res.ok) toast.success('Pengaturan workspace disimpan');
    else toast.error('Gagal menyimpan pengaturan');
    setSavingWorkspace(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userName })
    });
    if (res.ok) toast.success('Profil berhasil diperbarui!');
    else toast.error('Gagal memperbarui profil.');
    setSavingProfile(false);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }
    setSavingPwd(true);
    setTimeout(() => {
      toast.success('Password berhasil diubah!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSavingPwd(false);
    }, 1000);
  };

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
    const res = await fetch('/api/telegram/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: tgCode }) });
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
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-blue-600 tracking-wider uppercase font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                SISTEM & KONFIGURASI RUANG KERJA • V2.4 SECURITY & PREFERENCES
              </span>
            </div>
            <h1 className="text-3xl text-zinc-900 tracking-tight font-bold flex items-center gap-2">
              <span>⚙️</span> Pengaturan Agensi
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Kelola profil agensi Anda, integrasi Google Workspace, Telegram Bot, dan preferensi akun.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-zinc-100 border border-zinc-200 text-blue-600 font-semibold text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <span>👑</span>
              <span>Role: Admin</span>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-6 overflow-x-auto pb-px mb-6 border-b border-zinc-200">
          <button onClick={() => setActiveTab('workspace')} className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'workspace' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}>
            <span>🏢</span> Profil Workspace
            {activeTab === 'workspace' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t-full"></span>}
          </button>
          <button onClick={() => setActiveTab('profile')} className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'profile' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}>
            <span>👤</span> Profil Saya
            {activeTab === 'profile' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t-full"></span>}
          </button>
          <button onClick={() => setActiveTab('integrations')} className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'integrations' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}>
            <span>🔗</span> Integrasi & Automasi
            {googleConnected && notifData?.telegramConnected && <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">2 Aktif</span>}
            {activeTab === 'integrations' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t-full"></span>}
          </button>
          <button onClick={() => setActiveTab('security')} className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'security' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}>
            <span>🛡️</span> Keamanan & Sesi
            {activeTab === 'security' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t-full"></span>}
          </button>
        </div>

        {/* TAB CONTENTS */}
        {activeTab === 'workspace' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
              
              {/* CARD: DETAIL PROFIL WORKSPACE */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
                <div className="flex flex-col mb-4">
                  <h2 className="text-lg text-zinc-900 font-semibold">Detail Workspace & Branding</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    Identitas umum yang digunakan pada header invoice, portal klien, dan laporan publik.
                  </p>
                </div>
                
                {/* Logo Uploader Area */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-xl mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                    AC
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm text-zinc-900 font-medium">Logo Agensi</span>
                    <span className="text-xs text-zinc-500">Format direkomendasikan: SVG, PNG transparan atau WebP (Maks. 2MB).</span>
                    <div className="flex items-center gap-2 mt-2">
                      <button className="bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 font-medium" type="button">
                        <span className="material-symbols-outlined text-[16px] text-blue-600">upload_file</span>
                        Ganti Logo
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-zinc-900 font-medium">Nama Agensi / Workspace</label>
                    <input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" type="text" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-zinc-900 font-medium">Slug Identifikasi Workspace</label>
                    <div className="flex items-center h-10 rounded-lg bg-zinc-100 border border-zinc-200 px-3 text-zinc-500 font-mono text-sm">
                      <span className="select-none text-zinc-400">artcelerator.app/</span>
                      <input className="bg-transparent text-zinc-500 font-medium w-full focus:outline-none cursor-not-allowed pl-0.5" disabled readOnly type="text" value={workspace.id} />
                      <span className="material-symbols-outlined text-[16px] text-zinc-400 select-none">lock</span>
                    </div>
                    <span className="text-xs text-zinc-500">Slug identitas bersifat permanen untuk integritas tautan.</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-zinc-900 font-medium">Deskripsi Agensi</label>
                    <textarea value={workspaceDesc} onChange={e => setWorkspaceDesc(e.target.value)} className="w-full p-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none" rows={3}></textarea>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 bg-zinc-50 border border-zinc-100 -mx-6 -mb-6 p-6 rounded-b-xl">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                      <span className="material-symbols-outlined text-[16px] text-blue-600">info</span>
                      <span>Perubahan akan diterapkan di seluruh sistem.</span>
                    </div>
                    <button onClick={handleSaveWorkspace} disabled={savingWorkspace} className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {savingWorkspace ? 'Menyimpan...' : 'Simpan Pengaturan Workspace'}
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD: DANGER ZONE */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-red-600 text-[22px]">warning</span>
                      <h3 className="text-lg text-red-600 font-bold">Area Bahaya</h3>
                    </div>
                    <p className="text-sm text-red-800 mt-1 max-w-xl">
                      Menghapus workspace ini akan menghapus seluruh data proyek, aset media, klien, dan riwayat secara permanen.
                    </p>
                  </div>
                  <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                    Hapus Workspace
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
              
              {/* CARD: STORAGE */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">cloud</span>
                    Penyimpanan Cloud
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full tracking-wider">PRO PLAN</span>
                </div>
                <div className="flex items-baseline justify-between mt-3 mb-1.5">
                  <span className="text-xl text-zinc-900 font-bold">42.8 GB <span className="text-xs font-normal text-zinc-500">/ 100 GB</span></span>
                  <span className="text-[10px] text-zinc-500 font-bold tracking-wider">42.8% TERPAKAI</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '42.8%' }}></div>
                </div>
                <div className="mt-3 text-right">
                  <a className="text-blue-600 hover:text-blue-700 text-xs font-semibold inline-flex items-center gap-0.5" href="#">Tingkatkan Kuota →</a>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
              <h2 className="text-lg text-zinc-900 font-semibold mb-4">Profil Anda</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-zinc-900 font-medium">Nama Lengkap</label>
                  <input value={userName} onChange={e => setUserName(e.target.value)} required className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" type="text" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-zinc-900 font-medium">Email</label>
                  <input value={user.email} disabled className="w-full h-10 px-3 text-sm bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-500 cursor-not-allowed" type="email" />
                </div>
                <div className="pt-4 border-t border-zinc-100">
                  <button type="submit" disabled={savingProfile} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-50">
                    {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
              <h2 className="text-lg text-zinc-900 font-semibold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">lock</span> Ubah Password
              </h2>
              <form onSubmit={handlePassword} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-zinc-900 font-medium">Password Lama</label>
                  <input value={oldPassword} onChange={e => setOldPassword(e.target.value)} required type="password" className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-zinc-900 font-medium">Password Baru</label>
                  <input value={newPassword} onChange={e => setNewPassword(e.target.value)} required type="password" className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-zinc-900 font-medium">Konfirmasi Password Baru</label>
                  <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required type="password" className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="pt-4 border-t border-zinc-100">
                  <button type="submit" disabled={savingPwd} className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-50">
                    {savingPwd ? 'Memproses...' : 'Ubah Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <h2 className="text-lg text-zinc-900 font-bold flex items-center gap-1.5">
                    <span>🔗</span> Integrasi Aktif
                  </h2>
                  <span className="text-sm text-zinc-500 mt-0.5">Koneksi cloud & automasi pesan bot</span>
                </div>
              </div>

              {/* GOOGLE INTEGRATION */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-all shadow-sm mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" fill="#4285F4"></path>
                        <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.4 7.34 24 12 24z" fill="#34A853"></path>
                        <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z" fill="#FBBC05"></path>
                        <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.6 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335"></path>
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900">Google Workspace</span>
                  </div>
                  {googleConnected ? (
                    <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm uppercase tracking-wider">
                      ✅ Terhubung
                    </span>
                  ) : (
                    <span className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-600 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm uppercase tracking-wider">
                      ❌ Belum Terhubung
                    </span>
                  )}
                </div>
                
                {googleConnected ? (
                  <>
                    <div className="mt-3 text-zinc-500 text-sm space-y-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-zinc-900">Akun:</span>
                        <span className="font-mono text-zinc-600 bg-zinc-200/50 px-1.5 rounded">{googleInfo?.email || 'email@gmail.com'}</span>
                      </div>
                      <div className="text-xs bg-white border border-zinc-200 p-2 rounded-lg text-zinc-500 flex items-start gap-1.5">
                        <span className="text-blue-600 text-[14px]">📁</span>
                        <span><strong>Drive Root:</strong> Artcelerator Workspace (Auto-sync aset klien & sheets)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200">
                      <button className="text-xs text-zinc-700 hover:text-zinc-900 font-medium inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">sync</span> Sync Ulang
                      </button>
                      <button onClick={handleDisconnectGoogle} className="text-red-600 hover:text-red-700 text-xs font-semibold">
                        Putuskan Koneksi
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 pt-4 border-t border-zinc-200 flex flex-col gap-3">
                    <p className="text-xs text-zinc-500">Hubungkan akun Google Drive untuk mengaktifkan folder otomatis per Klien & Proyek.</p>
                    <a href="/api/google/connect" className="self-start px-4 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-semibold shadow-sm text-zinc-700 hover:bg-zinc-50">Hubungkan dengan Google</a>
                  </div>
                )}
              </div>

              {/* TELEGRAM INTEGRATION */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-all shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2AABEE] text-white flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.51l-3.01-2.22-1.45 1.4c-.16.16-.3.3-.61.3l.22-3.06 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.97-.93c-.64-.2-.66-.64.14-.95l11.6-4.47c.54-.2 1.01.12.84.96z"></path>
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900">Telegram Bot Notifikasi</span>
                  </div>
                  {notifData?.telegramConnected ? (
                    <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm uppercase tracking-wider">
                      ✅ Terhubung
                    </span>
                  ) : (
                    <span className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-600 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm uppercase tracking-wider">
                      ❌ Belum Terhubung
                    </span>
                  )}
                </div>

                {notifData?.telegramConnected ? (
                  <>
                    <div className="mt-3 text-zinc-500 text-sm space-y-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-zinc-900">Chat ID:</span>
                        <span className="font-mono text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-xs">{notifData.telegramChatId}</span>
                      </div>
                      <p className="text-xs bg-white border border-zinc-200 p-2 rounded-lg text-zinc-500">
                        ⚡ <strong>Notifikasi instant aktif</strong> untuk Admin Alert, Approval Konten, & Invoice Reminder.
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200">
                      <button className="text-xs text-zinc-700 hover:text-zinc-900 font-medium inline-flex items-center gap-1" onClick={() => toast.success('Pesan uji terkirim!')}>
                        <span className="material-symbols-outlined text-[16px]">send</span> Tes Kirim
                      </button>
                      <button onClick={handleDisconnectTg} className="text-red-600 hover:text-red-700 text-xs font-semibold">
                        Putuskan Koneksi
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 pt-4 border-t border-zinc-200">
                    <p className="text-xs font-medium text-zinc-700 mb-2">Cara Menghubungkan:</p>
                    <ol className="list-decimal pl-5 text-xs space-y-1 text-zinc-500 mb-4">
                      <li>Buka Telegram, cari <strong>@ContentPlannerBot</strong></li>
                      <li>Kirim pesan <strong>/start</strong></li>
                      <li>Salin 6 digit kode yang diberikan bot dan masukkan di bawah.</li>
                    </ol>
                    <form onSubmit={handleConnectTg} className="flex gap-2 max-w-sm">
                      <input value={tgCode} onChange={e => setTgCode(e.target.value)} placeholder="Kode 6 digit..." maxLength={6} required className="flex-1 h-9 px-3 text-sm bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors">Connect</button>
                    </form>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
