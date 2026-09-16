'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function TeamClient({ workspaceId, currentUserRole }: { workspaceId: string, currentUserRole: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('TEAM');
  const [inviting, setInviting] = useState(false);
  
  // Filters
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/workspaces/members');
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    const res = await fetch('/api/workspaces/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole })
    });
    
    if (res.ok) {
      toast.success('Anggota berhasil diundang dan ditambahkan!');
      setInviteEmail('');
      setIsInviteModalOpen(false);
      fetchMembers();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Gagal mengundang anggota.');
    }
    setInviting(false);
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    const res = await fetch(`/api/workspaces/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    if (res.ok) {
      toast.success('Role berhasil diperbarui!');
      fetchMembers();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Gagal mengubah role.');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Hapus anggota ini dari workspace?')) return;
    const res = await fetch(`/api/workspaces/members/${memberId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Anggota dihapus.');
      fetchMembers();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Gagal menghapus anggota.');
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesFilter = activeFilter === 'all' || m.role.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch = m.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://artcelerator.app/join/t-892f3a');
    toast.success('Tautan disalin!');
  };

  const roleCounts = {
    admin: members.filter(m => m.role === 'ADMIN').length,
    director: members.filter(m => m.role === 'CREATIVE_DIRECTOR').length,
    team: members.filter(m => m.role === 'TEAM').length,
    pending: members.filter(m => m.role === 'PENDING').length || 0, // Placeholder if pending status is ever added
  };

  if (loading) return <div className="pt-16 min-h-screen bg-zinc-50 flex justify-center"><div className="animate-pulse text-zinc-500 pt-10">Memuat anggota tim...</div></div>;

  return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full">
      <div className="flex flex-col w-full">
        <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* HEADER HALAMAN */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-blue-600 uppercase tracking-wider font-semibold">
                PENGATURAN & AKSES RUANG KERJA • V2.4 ACCESS CONTROL
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <h1 className="text-3xl text-zinc-900 tracking-tight font-bold flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[32px] text-blue-600">group</span>
                  Kelola Tim & Anggota
                </h1>
                <p className="text-sm text-zinc-500">
                  Undang anggota tim baru, atur role hak akses, dan pantau beban kerja tim agensi Anda.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
                <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-xl text-sm font-medium shadow-sm transition-all duration-150" type="button">
                  <span className="material-symbols-outlined text-[18px] text-zinc-500">admin_panel_settings</span>
                  Kebijakan Akses & Izin
                </button>
                <button onClick={() => setIsInviteModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all duration-150" type="button">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  + Undang Anggota
                </button>
              </div>
            </div>
          </div>

          {/* STAT CARDS TIM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Total Anggota Tim</span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-3xl font-bold text-zinc-900">{members.length}</span>
                  <span className="text-sm text-zinc-500 font-medium">Orang</span>
                </div>
                <p className="text-xs text-zinc-500 pt-1">3 Role terdaftar (Admin, Director, Team)</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined text-[22px]">groups</span>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Anggota Aktif Hari Ini</span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-3xl font-bold text-blue-600">{Math.max(1, members.length - 1)}</span>
                  <span className="text-sm text-zinc-500 font-medium">Orang</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  <p className="text-xs text-zinc-500">Sedang online & aktif mengerjakan deliverable</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined text-[22px]">bolt</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Undangan Menunggu (Pending)</span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-3xl font-bold text-amber-600">{roleCounts.pending || 0}</span>
                  <span className="text-sm text-zinc-500 font-medium">Undangan</span>
                </div>
                <p className="text-xs text-zinc-500 pt-1">Menunggu konfirmasi email</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined text-[22px]">mark_email_unread</span>
              </div>
            </div>
          </div>

          {/* QUICK ROLE OVERVIEW & BANNER INFORMASI */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0 mt-0.5 sm:mt-0">verified_user</span>
              <p className="text-xs text-zinc-700">
                <strong className="font-semibold text-zinc-900">Workspace RBAC Active:</strong> Admin memiliki akses penuh ke billing & klien, Creative Director mengelola workflow konten & approval, Team mengeksekusi aset kreatif.
              </p>
            </div>
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 shrink-0 self-end sm:self-auto">
              Pelajari Matriks Izin <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          </div>

          {/* DAFTAR ANGGOTA TIM */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-zinc-900 font-bold pr-2 flex items-center gap-1.5">
                  Anggota Tim Terdaftar <span className="text-[10px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">({members.length})</span>
                </span>
                <div className="inline-flex bg-zinc-100 p-1 rounded-xl gap-1 border border-zinc-200">
                  <button onClick={() => setActiveFilter('all')} className={`px-3 py-1 text-xs font-medium rounded-lg ${activeFilter === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>Semua ({members.length})</button>
                  <button onClick={() => setActiveFilter('ADMIN')} className={`px-3 py-1 text-xs font-medium rounded-lg ${activeFilter === 'ADMIN' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>Admin ({roleCounts.admin})</button>
                  <button onClick={() => setActiveFilter('CREATIVE_DIRECTOR')} className={`px-3 py-1 text-xs font-medium rounded-lg ${activeFilter === 'CREATIVE_DIRECTOR' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>Creative Director ({roleCounts.director})</button>
                  <button onClick={() => setActiveFilter('TEAM')} className={`px-3 py-1 text-xs font-medium rounded-lg ${activeFilter === 'TEAM' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>Team ({roleCounts.team})</button>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative min-w-[240px]">
                  <span className="material-symbols-outlined text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">search</span>
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-zinc-200 pl-9 pr-3 py-1.5 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Cari nama atau email..." type="text"/>
                </div>
                <div className="relative">
                  <select className="appearance-none bg-white border border-zinc-200 pl-3 pr-8 py-1.5 rounded-xl text-xs text-zinc-700 focus:outline-none cursor-pointer">
                    <option>Semua Departemen</option>
                    <option>Executive / Management</option>
                    <option>Creative & Editorial</option>
                    <option>Graphic Design & Video</option>
                  </select>
                  <span className="material-symbols-outlined text-zinc-400 text-[16px] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-200 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-6">ANGGOTA TIM</th>
                    <th className="py-3 px-6">ROLE & AKSES</th>
                    <th className="py-3 px-6">BEBAN KERJA KONTEN</th>
                    <th className="py-3 px-6">TANGGAL BERGABUNG</th>
                    <th className="py-3 px-6 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-zinc-100">
                  {filteredMembers.map((m, i) => (
                    <tr key={m.id} className="hover:bg-zinc-50/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 shadow-sm ${m.role === 'ADMIN' ? 'bg-blue-600' : m.role === 'CREATIVE_DIRECTOR' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                            {getInitials(m.user?.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-zinc-900 truncate">{m.user?.name || 'User'}</span>
                              {m.role === 'ADMIN' && <span className="text-[10px] bg-zinc-900 text-white px-2 py-0.5 rounded-full font-semibold tracking-wider">OWNER</span>}
                            </div>
                            <span className="text-xs text-zinc-500 truncate">{m.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {m.role === 'ADMIN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="material-symbols-outlined text-[14px]">shield</span> ADMIN
                          </span>
                        )}
                        {m.role === 'CREATIVE_DIRECTOR' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <span className="material-symbols-outlined text-[14px]">palette</span> CREATIVE DIRECTOR
                          </span>
                        )}
                        {m.role === 'TEAM' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="material-symbols-outlined text-[14px]">person</span> TEAM
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 w-44">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-zinc-700">{i * 3 + 2} Konten Aktif</span>
                            <span className="font-mono text-[10px] text-zinc-500">{15 + i * 15}%</span>
                          </div>
                          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${m.role === 'ADMIN' ? 'bg-blue-600' : 'bg-emerald-500'}`} style={{ width: `${15 + i * 15}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-zinc-500 text-xs">
                        {new Date(m.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            className="text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-lg px-2 py-1 focus:outline-none hover:bg-zinc-100 cursor-pointer"
                            value={m.role}
                            onChange={(e) => handleChangeRole(m.id, e.target.value)}
                          >
                            <option value="ADMIN">Ubah: Admin</option>
                            <option value="CREATIVE_DIRECTOR">Ubah: Creative Dir.</option>
                            <option value="TEAM">Ubah: Team</option>
                          </select>
                          <button onClick={() => handleRemove(m.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Anggota">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-zinc-500 text-sm">Tidak ada anggota yang ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-xs">
              <span>Menampilkan <strong>{filteredMembers.length}</strong> dari <strong>{members.length}</strong> anggota terdaftar</span>
              <div className="inline-flex items-center gap-1">
                <button className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-600 shadow-sm" disabled>Sebelumnya</button>
                <button className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold shadow-sm">1</button>
                <button className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm">Selanjutnya</button>
              </div>
            </div>
          </div>

          {/* SECTION BOTTOM: DISTRIBUSI KAPASITAS & BEBAN KERJA TIM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[20px]">query_stats</span>
                    Utilisasi Kapasitas Tim (Sprint Ini)
                  </h2>
                  <p className="text-xs text-zinc-500">Total 35 konten aktif sedang dalam pengerjaan tim kreatif</p>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-1 rounded-full tracking-wider">
                  SEHAT • 58%
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-700">Kapasitas Agensi Rata-rata</span>
                  <span className="text-blue-600 font-mono">58% Terpakai</span>
                </div>
                <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: '58%' }}></div>
                </div>
              </div>
              <div className="pt-2 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Desain Grafis (14 aset aktif)</span>
                    <span className="font-mono font-medium text-zinc-700">70%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Video Production & Reels (12 proyek)</span>
                    <span className="font-mono font-semibold text-amber-600">85% (Padat)</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Copywriting & Content Strategy (9 draft)</span>
                    <span className="font-mono font-medium text-zinc-700">40%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">link</span>
                  <h2 className="text-base font-bold text-zinc-900">Undang Cepat Lewat Tautan</h2>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Bagikan link undangan aman dengan role default <strong className="text-zinc-700 font-semibold">[Team]</strong> yang aktif selama 48 jam ke anggota baru atau kolaborator eksternal.
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Tautan Undangan Aktif</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input className="w-full bg-zinc-50 border border-zinc-200 font-mono text-xs text-zinc-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500" readOnly type="text" value="https://artcelerator.app/join/t-892f3a" />
                  </div>
                  <button onClick={handleCopyLink} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors shrink-0" type="button">
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    Salin Tautan
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock_clock</span>
                  Kedaluwarsa dalam 47 jam 18 menit • Sekali pakai per email
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <span>Ingin mengubah role default tautan cepat?</span>
                <button className="font-semibold text-blue-600 hover:underline">Konfigurasi Akses</button>
              </div>
            </div>
          </div>

          {/* Interactive Invite Modal */}
          {isInviteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-zinc-200 animate-in fade-in zoom-in-95">
                <div className="p-6 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[22px]">person_add</span>
                    <h3 className="text-lg font-bold text-zinc-900">Undang Anggota Tim Baru</h3>
                  </div>
                  <button onClick={() => setIsInviteModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <form onSubmit={handleInvite}>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-900 block">Alamat Email Anggota</label>
                      <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required type="email" className="w-full bg-white border border-zinc-200 px-3 py-2 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="nama@agensi.com atau kolaborator@domain.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-900 block">Role Akses</label>
                        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full bg-white border border-zinc-200 px-3 py-2 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="TEAM">Team (Eksekutor Kreatif)</option>
                          <option value="CREATIVE_DIRECTOR">Creative Director</option>
                          <option value="ADMIN">Admin / Management</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-900 block">Departemen</label>
                        <select className="w-full bg-white border border-zinc-200 px-3 py-2 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option>Graphic Design & Video</option>
                          <option>Copywriting & Social</option>
                          <option>Creative & Editorial</option>
                          <option>Motion Graphics & 3D</option>
                          <option>Media & Accounts</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-900 block">Catatan Sambutan (Opsional)</label>
                      <textarea className="w-full bg-white border border-zinc-200 p-3 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" placeholder="Selamat datang di tim! Silakan login dan periksa tugas pertama Anda di workspace." rows={2}></textarea>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-sm font-medium transition-colors">
                      Batal
                    </button>
                    <button type="submit" disabled={inviting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50">
                      <span className="material-symbols-outlined text-[16px]">{inviting ? 'hourglass_empty' : 'send'}</span>
                      {inviting ? 'Mengirim...' : 'Kirim Undangan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
