import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 font-sans antialiased">
      {/* TOPBAR HEADER PUBLIK */}
      <header className="sticky top-0 z-50 bg-zinc-50/90 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-base shadow-sm group-hover:bg-blue-600 transition-colors">
              📋
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 leading-tight">Artcelerator</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 -mt-0.5">Workspace OS</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <a href="#fitur" className="hover:text-zinc-950 transition-colors">Fitur</a>
            <a href="#preview" className="hover:text-zinc-950 transition-colors">Preview</a>
            <a href="#solusi" className="hover:text-zinc-950 transition-colors">Tentang</a>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              v2.4 Live
            </span>
          </nav>

          <div className="flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <Link href="/login" className="border border-zinc-200 text-zinc-800 hover:bg-zinc-100/70 hover:border-zinc-300 rounded-lg px-4 py-2 text-sm font-semibold transition-all">
                  Masuk
                </Link>
                <Link href="/register" className="bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5">
                  <span>Daftar Gratis</span>
                  <svg className="w-3.5 h-3.5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </Link>
              </>
            ) : (
              <Link href="/dashboard" className="bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5">
                <span>Ke Dashboard</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1" style={{ background: 'radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.08) 0%, rgba(250, 250, 250, 0) 70%)' }}>
        <section className="max-w-5xl mx-auto text-center pt-16 pb-12 sm:pt-20 sm:pb-16 px-6">
          <div className="inline-flex items-center gap-2 bg-white/90 text-zinc-800 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-zinc-200/90 mb-6 shadow-sm hover:border-blue-600/40 transition-colors cursor-default">
            <span>✨</span>
            <span>Platform Manajemen Konten & Agensi All-in-One</span>
            <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
            <span className="text-blue-600 font-medium">Bebas Spreadsheet</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.12] mb-6 max-w-4xl mx-auto">
            Kelola Konten, Klien, & Agensi Anda dalam <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-blue-600 to-zinc-900">Satu Tempat.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Platform terpadu untuk merencanakan, menyetujui, dan mempublikasikan konten digital agensi Anda — tanpa spreadsheet rumit dan pesan chat tercecer.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            {!isLoggedIn ? (
              <Link href="/register" className="w-full sm:w-auto bg-zinc-900 text-white text-base font-semibold px-8 py-3.5 rounded-xl shadow-lg hover:bg-zinc-800 hover:shadow-xl transition-all flex items-center justify-center gap-2 group">
                <span>Mulai Gratis Sekarang</span>
                <span className="text-zinc-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            ) : (
              <Link href="/dashboard" className="w-full sm:w-auto bg-blue-600 text-white text-base font-semibold px-8 py-3.5 rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 group">
                <span>Ke Dashboard Saya</span>
                <span className="text-white group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            )}
            <a href="#preview" className="w-full sm:w-auto border border-zinc-200 bg-white text-zinc-800 text-base font-semibold px-8 py-3.5 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 shadow-sm transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Lihat Demo Dashboard</span>
            </a>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              Tanpa Kartu Kredit
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              Setup Dalam 2 Menit
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              Digunakan 50+ Agensi Kreatif
            </span>
          </div>
        </section>

        {/* TAMPILAN PREVIEW APLIKASI (MOCKUP DASHBOARD) */}
        <section id="preview" className="max-w-6xl mx-auto px-4 sm:px-6 my-8 sm:my-14">
          <div className="shadow-[0_25px_60px_-15px_rgba(28,36,48,0.12),0_0_0_1px_rgba(28,36,48,0.06)] border border-zinc-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-zinc-100/80 border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80 border border-red-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400/80 border border-amber-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400/80 border border-emerald-500/20"></div>
                <span className="ml-2 text-xs font-mono text-zinc-400 hidden sm:inline">artcelerator.app/dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Workspace
                </span>
              </div>
            </div>

            <div className="flex min-h-[460px] bg-zinc-50">
              <div className="w-56 bg-white border-r border-zinc-200 p-4 hidden md:flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6 px-2">
                    <div className="w-6 h-6 rounded bg-blue-600 text-white text-xs flex items-center justify-center font-bold">AC</div>
                    <span className="text-xs font-bold text-zinc-900 tracking-tight">Artcelerator OS</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 mb-1">Utama</div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-50 text-blue-600 text-xs font-semibold">
                      <span>📊</span> <span>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 text-xs font-medium">
                      <span>📅</span> <span>Kalender</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 text-xs font-medium">
                      <span>📑</span> <span>Pipeline</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 text-xs font-medium">
                      <span>📝</span> <span>Konten</span>
                    </div>

                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 mt-4 mb-1">Agensi</div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 text-xs font-medium">
                      <span>👥</span> <span>Klien (CRM)</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 text-xs font-medium">
                      <span>📁</span> <span>Proyek</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 text-xs font-medium">
                      <span>💰</span> <span>Keuangan</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center gap-2 px-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white text-[11px] font-bold flex items-center justify-center">AP</div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-semibold text-zinc-900 truncate">Andi Pratama</div>
                    <div className="text-[10px] text-zinc-400 truncate">Agency Director</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-5 sm:p-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-zinc-200/80 gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Overview Workspace</div>
                    <h2 className="text-xl font-bold text-zinc-900">Dashboard Utama Agensi</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-600 font-medium">Bulan Ini: Juli 2025</span>
                    <span className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-lg font-semibold">+ Konten Baru</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
                  <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-sm">
                    <div className="text-xs text-zinc-500 font-medium">Konten Aktif</div>
                    <div className="text-xl font-bold text-zinc-900 mt-1">48 <span className="text-xs font-normal text-emerald-600">+12%</span></div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">8 dalam antrean review</div>
                  </div>
                  <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-sm">
                    <div className="text-xs text-zinc-500 font-medium">Klien Aktif Retainer</div>
                    <div className="text-xl font-bold text-zinc-900 mt-1">14 <span className="text-xs font-normal text-blue-600">Brand</span></div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">100% retensi bulan ini</div>
                  </div>
                  <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-sm">
                    <div className="text-xs text-zinc-500 font-medium">Total Pendapatan</div>
                    <div className="text-xl font-bold text-zinc-900 mt-1">Rp 128.5M</div>
                    <div className="text-[11px] text-emerald-600 mt-0.5">↑ Rp 18M vs bulan lalu</div>
                  </div>
                  <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-sm">
                    <div className="text-xs text-zinc-500 font-medium">On-Time Approval</div>
                    <div className="text-xl font-bold text-zinc-900 mt-1">94.2%</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Rata-rata review 3.4 jam</div>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <span className="text-xs font-bold text-zinc-800">Daftar Konten Mendatang (Sprint Aktif)</span>
                    <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">Lihat Semua →</span>
                  </div>
                  <div className="divide-y divide-zinc-100 text-xs">
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="font-semibold text-zinc-800">Tips Glow Routine: Pagi vs Malam</span>
                        <span className="text-zinc-400">• Skincare Glow</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Review Klien</span>
                        <span className="text-zinc-400 hidden sm:inline">Besok, 10:00</span>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        <span className="font-semibold text-zinc-800">BTS Roasting Kopi Arabika Specialty</span>
                        <span className="text-zinc-400">• Kopi Nusantara</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Siap Publish</span>
                        <span className="text-zinc-400 hidden sm:inline">Hari ini, 19:00</span>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-semibold text-zinc-800">Promo Flash Sale Mid-Year 70%</span>
                        <span className="text-zinc-400">• Sport Brand Indo</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">Produksi Visual</span>
                        <span className="text-zinc-400 hidden sm:inline">24 Jul 2025</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 PILAR FITUR UTAMA */}
        <section id="fitur" className="max-w-6xl mx-auto py-16 sm:py-20 px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Dirancang Khusus Agensi Modern</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">Semua Fitur Kunci untuk Skalakan Agensi Anda</h2>
            <p className="text-zinc-600 mt-3 text-base">Tinggalkan proses manual yang memperlambat tim. Dari konsep ide hingga tagihan cair, semua terotomasi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-zinc-200 rounded-2xl p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-2xl mb-5">📝</div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Manajemen Konten & Kanban</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Alur kerja terstruktur dari ide, draf copywriting, desain visual, hingga publish dengan proses persetujuan (approval) berjenjang oleh Creative Director dan Klien.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center text-xs font-semibold text-blue-600 cursor-pointer">
                <span>Jelajahi Alur Kanban</span>
                <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-2xl mb-5">👥</div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">CRM Klien & Proyek</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Kelola kontrak retainer bulanan, scope proyek, daftar deliverables per kuartal, serta dokumentasi catatan komunikasi klien dalam satu database terpusat yang rapi.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center text-xs font-semibold text-blue-600 cursor-pointer">
                <span>Lihat Manajemen CRM</span>
                <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-2xl mb-5">💰</div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Keuangan & PDF Invoice</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Buat tagihan invoice termin otomatis, hasilkan berkas PDF profesional siap kirim ke klien, dan pantau arus kas serta profit & loss (P&L) agensi secara real-time.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center text-xs font-semibold text-blue-600 cursor-pointer">
                <span>Pelajari Modul Keuangan</span>
                <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>
        </section>

        {/* BANNER PRE-FOOTER CTA */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-2xl p-8 sm:p-12 text-center shadow-xl border border-zinc-800">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">Siap Membawa Agensi Anda ke Level Berikutnya?</h3>
            <p className="text-zinc-300 text-sm sm:text-base max-w-xl mx-auto mb-8">Bergabunglah dengan agensi kreatif Indonesia yang telah meningkatkan efisiensi alur kerja konten hingga 3x lipat.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isLoggedIn ? "/dashboard" : "/register"} className="w-full sm:w-auto bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md">
                {isLoggedIn ? 'Buka Dashboard Saya →' : 'Mulai Uji Coba Gratis 14 Hari →'}
              </Link>
              <Link href={isLoggedIn ? "/dashboard" : "/register"} className="w-full sm:w-auto text-zinc-300 hover:text-white text-sm font-medium px-6 py-3 transition-colors">
                Jadwalkan Konsultasi Tim Agensi
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER PUBLIK */}
      <footer className="border-t border-zinc-200 bg-white py-10 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium text-zinc-700">
            <span>📋 Artcelerator Workspace</span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-400">The Operating System for Creative Agencies</span>
          </div>
          <div>
            <p>© {new Date().getFullYear()} Artcelerator Workspace. Hak Cipta Dilindungi. Dibuat untuk Agensi Kreatif Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
