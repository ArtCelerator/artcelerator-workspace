export const dynamic = "force-dynamic";
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
  const workspaceId = workspace.id;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 8);

  const totalContent = await prisma.content.count({ where: { workspaceId } });

  const statusCounts = await prisma.content.groupBy({
    by: ['status'],
    where: { workspaceId },
    _count: true
  });
  const stats = {
    total: totalContent,
    idea: statusCounts.find(s => s.status === 'IDEA')?._count || 0,
    drafting: statusCounts.find(s => s.status === 'DRAFTING')?._count || 0,
    scheduled: statusCounts.find(s => s.status === 'SCHEDULED')?._count || 0,
    published: statusCounts.find(s => s.status === 'PUBLISHED')?._count || 0,
  };

  const todayContent = await prisma.content.findMany({
    where: { workspaceId, publishDate: today },
    orderBy: { publishTime: 'asc' },
    select: { id: true, title: true, platform: true, publishTime: true, status: true, assignedTo: { select: { name: true } } }
  });

  const overdue = await prisma.content.findMany({
    where: { workspaceId, publishDate: { lt: today }, status: { notIn: ['PUBLISHED', 'ARCHIVED'] } },
    orderBy: { publishDate: 'asc' },
    select: { id: true, title: true, platform: true, publishDate: true, publishTime: true, status: true, assignedTo: { select: { name: true } } }
  });

  const upcoming = await prisma.content.findMany({
    where: { workspaceId, publishDate: { gte: tomorrow, lt: next7Days }, status: { notIn: ['ARCHIVED'] } },
    orderBy: { publishDate: 'asc' },
    select: { id: true, title: true, platform: true, publishDate: true, publishTime: true, status: true, assignedTo: { select: { name: true } } }
  });

  const pillars = await prisma.contentPillar.findMany({
    where: { workspaceId },
    include: { _count: { select: { contents: true } } }
  });

  const healthScore = overdue.length === 0 ? 100 : Math.max(0, 100 - (overdue.length * 15));

  const formatTime = (timeStr: string | null) => timeStr || 'TBA';
  const formatShortDate = (date: Date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col w-full bg-zinc-50 min-h-full">
      <div className="p-6 max-w-[1560px] mx-auto w-full space-y-6">
        
        {/* 1. Hero Banner */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-900 text-white p-6 sm:p-8 shadow-md">
          <div className="absolute -right-20 -top-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>
          <div className="absolute right-1/3 -bottom-20 w-80 h-80 rounded-full bg-orange-500/15 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-bold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Pipeline Active
                </span>
                <span className="text-white/40 text-xs font-mono uppercase">Dashboard Agensi</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-white">
                Selamat Datang, {session.user.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-sm text-zinc-300 mt-2">
                Berikut ringkasan performa agensimu hari ini. Sebanyak <span className="text-white font-medium">{todayContent.length} konten</span> siap dipublikasi hari ini.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Link href="/calendar">
                <button className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all duration-150">
                  <span className="text-lg">📅</span> Atur Jadwal
                </button>
              </Link>
              <Link href="/contents/new">
                <button className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-sm font-semibold shadow-sm hover:shadow transition-all duration-150">
                  <span className="text-lg">➕</span> Buat Konten
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. 5 Metrik Statistik */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Total Konten</span>
              <div className="w-7 h-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-600 group-hover:text-blue-600 transition-colors">
                <span className="text-lg">📚</span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl leading-none font-bold text-zinc-900 tracking-tight">{stats.total}</span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Bulan ini</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Ide Backlog</span>
              <div className="w-7 h-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-600 group-hover:text-amber-600 transition-colors">
                <span className="text-lg">💡</span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl leading-none font-bold text-zinc-900 tracking-tight">{stats.idea}</span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded">Brainstorm</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Drafting</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <span className="text-lg">✍️</span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl leading-none font-bold text-zinc-900 tracking-tight">{stats.drafting}</span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">Proses</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Dijadwalkan</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <span className="text-lg">📅</span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl leading-none font-bold text-purple-700 tracking-tight">{stats.scheduled}</span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded">Ready</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow transition-all flex flex-col justify-between group col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Published</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <span className="text-lg">✅</span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl leading-none font-bold text-emerald-700 tracking-tight">{stats.published}</span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">Selesai</span>
            </div>
          </div>
        </div>

        {/* 3. Grid Tengah */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Konten Hari Ini */}
          <div className="lg:col-span-7 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📌</span>
                  <div>
                    <h2 className="text-lg text-zinc-900 font-semibold tracking-tight">Konten Hari Ini</h2>
                    <p className="text-xs text-zinc-500">Jadwal publikasi multi-platform hari ini</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-[10px] tracking-wider uppercase font-semibold">
                  {todayContent.length} Rilis
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {todayContent.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic py-4">Tidak ada jadwal rilis hari ini.</p>
                ) : (
                  todayContent.map(item => (
                    <div key={item.id} className="p-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white shadow-sm text-center">
                          <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Waktu</span>
                          <span className="text-sm font-mono font-semibold text-zinc-900">{formatTime(item.publishTime)}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 text-[10px] font-bold uppercase">{item.platform}</span>
                            <span className="px-2 py-0.5 rounded bg-white text-zinc-500 text-[10px] font-bold uppercase">{item.status}</span>
                          </div>
                          <Link href={`/contents/${item.id}`}>
                            <h3 className="text-sm font-semibold text-zinc-900 hover:text-blue-600 transition-colors cursor-pointer">
                              {item.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            PIC: <strong className="font-medium text-zinc-900">{item.assignedTo?.name || 'TBA'}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] tracking-wider uppercase font-bold bg-emerald-50 px-2 py-1 rounded">
                          ✅ Siap Tayang
                        </span>
                        <Link href={`/contents/${item.id}`}>
                          <button className="text-zinc-400 hover:text-blue-600 transition-colors p-1" title="Lihat Pratinjau">
                            <span className="text-lg">👁️</span>
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Terlambat (Overdue) */}
          <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-400"></div>
            <div>
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <span className="text-lg">⚠️</span>
                  </div>
                  <div>
                    <h2 className="text-lg text-zinc-900 font-semibold tracking-tight">Terlambat (Overdue)</h2>
                    <p className="text-xs text-zinc-500">Perlu tindakan korektif segera</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">
                  {overdue.length} Urgent
                </span>
              </div>
              <div className="space-y-2 mt-1">
                {overdue.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic py-4">Bagus! Semua konten sesuai jadwal.</p>
                ) : (
                  overdue.slice(0,3).map(item => (
                    <div key={item.id} className="p-4 rounded-xl bg-red-50/40 hover:bg-red-50/70 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-red-700 text-[10px] font-bold bg-red-100/80 px-2 py-0.5 rounded uppercase">
                          ⏰ Terlambat
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Deadline: {formatShortDate(item.publishDate as Date)}</span>
                      </div>
                      <Link href={`/contents/${item.id}`}>
                        <h3 className="text-sm font-semibold text-zinc-900 mt-2 line-clamp-1 hover:text-red-600 transition-colors">{item.title}</h3>
                      </Link>
                      <p className="text-xs text-zinc-500 mt-1">
                        Kanal: <span className="text-zinc-900 font-medium">{item.platform}</span> • Status: <span className="text-amber-700 font-medium">{item.status}</span>
                      </p>
                      <div className="mt-4 pt-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">
                            {item.assignedTo ? getInitials(item.assignedTo.name || '') : '?'}
                          </div>
                          <span className="text-xs text-zinc-500">{item.assignedTo?.name || 'Belum di-assign'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/contents/${item.id}`}>
                            <button className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors shadow-sm">
                              Tindak Lanjuti
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {overdue.length > 3 && (
                  <div className="text-center pt-2">
                    <Link href="/pipeline" className="text-xs text-blue-600 hover:underline">Lihat {overdue.length - 3} konten terlambat lainnya...</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Grid Bawah */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upcoming 7 Hari */}
          <div className="lg:col-span-7 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <div>
                    <h2 className="text-lg text-zinc-900 font-semibold tracking-tight">Upcoming 7 Hari</h2>
                    <p className="text-xs text-zinc-500">Jadwal distribusi 7 hari ke depan</p>
                  </div>
                </div>
                <Link href="/calendar">
                  <button className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-xs font-medium transition-colors">
                    Kalender Lengkap &rarr;
                  </button>
                </Link>
              </div>
              <div className="space-y-2 mt-1">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic py-4">Belum ada jadwal tayang dalam 7 hari ke depan.</p>
                ) : (
                  upcoming.slice(0,5).map(item => {
                    const isTomorrow = item.publishDate?.getDate() === tomorrow.getDate();
                    return (
                      <div key={item.id} className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-16 text-center shrink-0">
                            <span className={`block text-[10px] font-bold uppercase ${isTomorrow ? 'text-blue-600' : 'text-zinc-900'}`}>{isTomorrow ? 'Besok' : item.publishDate?.toLocaleDateString('id-ID', { weekday: 'long' })}</span>
                            <span className="block text-xs font-mono text-zinc-500">{formatShortDate(item.publishDate as Date)}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-white text-zinc-900 text-[10px] font-bold uppercase">{item.platform}</span>
                              <span className="text-xs text-zinc-500">{formatTime(item.publishTime)}</span>
                            </div>
                            <Link href={`/contents/${item.id}`} className="hover:text-blue-600">
                              <h4 className="text-sm font-medium text-zinc-900 truncate mt-0.5">{item.title}</h4>
                            </Link>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 pl-2">
                          <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-bold flex items-center justify-center shadow-sm" title={`PIC: ${item.assignedTo?.name || 'TBA'}`}>
                            {item.assignedTo ? getInitials(item.assignedTo.name || '') : '?'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Distribusi Pilar */}
          <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏛️</span>
                  <div>
                    <h2 className="text-lg text-zinc-900 font-semibold tracking-tight">Distribusi Pilar</h2>
                    <p className="text-xs text-zinc-500">Komposisi tema konten bulan ini</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded">
                  {stats.total} Total Konten
                </span>
              </div>
              <div className="space-y-4 mt-2">
                {pillars.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic py-4">Belum ada pilar konten yang dibuat.</p>
                ) : (
                  pillars.map(pillar => {
                    const currentPercentage = stats.total > 0 ? Math.round((pillar._count.contents / stats.total) * 100) : 0;
                    return (
                      <div key={pillar.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-zinc-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: pillar.color }}></span>
                            {pillar.name}
                          </span>
                          <span className="font-mono text-zinc-500 font-medium">{currentPercentage}% <span className="text-zinc-900 font-semibold">({pillar._count.contents} post)</span></span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${currentPercentage}%`, backgroundColor: pillar.color }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs mt-4 border-t">
              <Link href="/pillars" className="text-blue-600 font-medium hover:underline">Kelola Pilar &rarr;</Link>
            </div>
          </div>
        </div>

        {/* 5. Health Status Footer */}
        <div className="p-4 rounded-xl bg-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${healthScore >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} flex items-center justify-center shrink-0`}>
              <span className="text-2xl">{healthScore >= 70 ? '🚀' : '❤️‍🩹'}</span>
            </div>
            <div>
              <h4 className="text-base font-semibold text-zinc-900">Pipeline Health Score: {healthScore}/100</h4>
              <p className="text-xs text-zinc-500">Kecepatan produksi {healthScore >= 70 ? 'berada pada level optimal' : 'perlu perhatian karena banyak tugas menunggak'}.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/analytics">
              <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm">
                Lihat Analytics
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
