'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PLATFORM_INFO, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants';
import { StatusBadge } from '@/components/content/status-badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

function getMonthDays(currentDate: Date) {
  const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  let startDay = start.getDay(); 
  startDay = startDay === 0 ? 6 : startDay - 1; 
  
  const days = [];
  
  const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), prevMonthEnd.getDate() - i);
    days.push({ date: d, isCurrentMonth: false });
  }
  
  for (let i = 1; i <= end.getDate(); i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    days.push({ date: d, isCurrentMonth: true });
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
    days.push({ date: d, isCurrentMonth: false });
  }
  
  return days;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  // Create Modal state
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState('');

  const fetchEvents = async (date: Date) => {
    setLoading(true);
    // Fetch range covering the visible 42 days
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 15).toISOString();
    const end = new Date(date.getFullYear(), date.getMonth() + 2, 15).toISOString();
    
    try {
      const res = await fetch(`/api/calendar?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const days = useMemo(() => getMonthDays(currentDate), [currentDate]);
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setPrefilledDate(`${yyyy}-${mm}-${dd}`);
    setShowQuickSchedule(true);
  };

  // Metrics calculation
  const currentMonthEvents = events.filter(e => {
    const d = new Date(e.start);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  });
  const totalPosts = currentMonthEvents.length;
  const scheduledCount = currentMonthEvents.filter(e => e.extendedProps.status === 'SCHEDULED').length;
  const publishedCount = currentMonthEvents.filter(e => e.extendedProps.status === 'PUBLISHED').length;
  const reviewCount = currentMonthEvents.filter(e => e.extendedProps.status === 'REVIEW').length;

  return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full">
      <div className="px-6 space-y-6 max-w-[1720px] mx-auto w-full pb-10">
        
        {/* 1. HEADER HALAMAN */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold uppercase">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>JADWAL KONTEN MULTI-PLATFORM</span>
              </div>
            </div>
            <h1 className="text-2xl text-zinc-900 tracking-tight font-bold flex items-center gap-2">
              <span>📅</span>
              <span>Kalender Konten</span>
            </h1>
            <p className="text-sm text-zinc-500">
              Lihat dan kelola seluruh jadwal postingan dalam tampilan kalender interaktif agensi.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => { setPrefilledDate(''); setShowQuickSchedule(true); }}
              className="inline-flex items-center gap-1 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98]" 
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>+ Buat Jadwal</span>
            </button>
            
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl shadow-inner">
              <button className="px-3 py-1 text-zinc-900 text-sm font-semibold bg-white rounded-lg shadow-sm" type="button">
                Bulan
              </button>
              <button className="px-3 py-1 text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors disabled:opacity-50" disabled type="button">
                Minggu
              </button>
            </div>
            
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-zinc-200">
              <button onClick={handlePrevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-600" type="button">
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <div className="px-3 py-1 bg-zinc-50 rounded-lg text-sm text-zinc-900 font-semibold tracking-tight min-w-[120px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: id })}
              </div>
              <button onClick={handleNextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-600" type="button">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
            
            <button onClick={handleToday} className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-900 text-sm font-medium rounded-xl shadow-sm border border-zinc-200 transition-colors" type="button">
              Hari Ini
            </button>
          </div>
        </div>

        {/* 2. FILTER RINGKAS & STATISTIK BULAN INI */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-zinc-200">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Total Posting</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl text-zinc-900 font-bold">{totalPosts}</span>
                <span className="text-xs text-zinc-500">rencana bulan ini</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-zinc-200">
            <div className="flex flex-col">
              <span className="text-xs text-blue-700 uppercase font-semibold tracking-wider">Dijadwalkan</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl text-zinc-900 font-bold">{scheduledCount}</span>
                <span className="text-xs text-blue-700 font-medium">auto-sync aktif</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">schedule_send</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-zinc-200">
            <div className="flex flex-col">
              <span className="text-xs text-emerald-600 uppercase font-semibold tracking-wider">Berhasil Terbit</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl text-zinc-900 font-bold">{publishedCount}</span>
                <span className="text-xs text-zinc-500">di berbagai kanal</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-zinc-200">
            <div className="flex flex-col">
              <span className="text-xs text-orange-500 uppercase font-semibold tracking-wider">Butuh Konfirmasi</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl text-amber-700 font-bold">{reviewCount}</span>
                <span className="text-xs text-orange-500 font-medium">pending klien</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
          </div>
        </div>

        {/* 3. KOTAK KALENDER BULANAN */}
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5 border border-zinc-200">
          <div className="rounded-xl overflow-hidden shadow-inner bg-zinc-50">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-white py-2.5 shadow-sm border-b border-zinc-200">
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, i) => (
                <div key={day} className={`text-center text-[11px] font-bold uppercase ${i >= 5 ? 'text-orange-500' : 'text-zinc-500'}`}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-zinc-200">
              {days.map((day, idx) => {
                const dayEvents = events.filter(e => {
                  const ed = new Date(e.start);
                  return ed.getDate() === day.date.getDate() && 
                         ed.getMonth() === day.date.getMonth() && 
                         ed.getFullYear() === day.date.getFullYear();
                });
                
                const now = new Date();
                const isToday = day.date.getDate() === now.getDate() && 
                                day.date.getMonth() === now.getMonth() && 
                                day.date.getFullYear() === now.getFullYear();
                const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

                return (
                  <div 
                    key={idx} 
                    onDoubleClick={() => handleDateClick(day.date)}
                    className={`min-h-[124px] p-2 flex flex-col justify-between group transition relative ${
                      day.isCurrentMonth ? (isToday ? 'bg-blue-50 shadow-md overflow-hidden z-10 ring-1 ring-blue-500' : 'bg-white hover:bg-zinc-50') : 'bg-zinc-50/70 hover:bg-zinc-50'
                    }`}
                  >
                    {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>}
                    
                    <div className="flex items-center justify-between">
                      {isToday ? (
                        <div className="flex items-center gap-1.5">
                          <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-sm font-bold shadow-sm">{day.date.getDate()}</span>
                          <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">HARI INI</span>
                        </div>
                      ) : (
                        <>
                          <span className={`text-sm font-semibold ${day.isCurrentMonth ? (isWeekend ? 'text-orange-500' : 'text-zinc-900') : 'text-zinc-400 font-medium'}`}>
                            {day.date.getDate()}
                          </span>
                          {!day.isCurrentMonth && <span className="text-[10px] font-mono text-zinc-400">{format(day.date, 'MMM', { locale: id })}</span>}
                        </>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDateClick(day.date); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-200 text-blue-600 transition-opacity" 
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                      </button>
                    </div>

                    <div className="flex-1 mt-1.5 space-y-1">
                      {dayEvents.map(event => {
                        const eventDate = new Date(event.start);
                        const isOverdue = event.extendedProps.status !== 'PUBLISHED' && eventDate < now;
                        
                        let bgClass = 'bg-zinc-100 text-zinc-900';
                        let dotClass = 'bg-zinc-400';
                        
                        if (isOverdue) {
                          bgClass = 'bg-red-500 text-white hover:brightness-110';
                          dotClass = 'bg-white animate-ping';
                        } else if (event.extendedProps.status === 'PUBLISHED') {
                          bgClass = 'bg-emerald-100 text-zinc-900 hover:brightness-95';
                          dotClass = 'bg-emerald-500';
                        } else if (event.extendedProps.status === 'SCHEDULED') {
                          bgClass = 'bg-white border border-zinc-200 text-blue-700 hover:bg-zinc-50';
                          dotClass = 'bg-blue-600';
                        } else if (event.extendedProps.status === 'REVIEW') {
                          bgClass = 'bg-amber-100 text-amber-800 hover:brightness-95';
                          dotClass = 'bg-orange-500';
                        } else {
                          bgClass = 'bg-zinc-100 text-zinc-800 hover:brightness-95';
                          dotClass = 'bg-zinc-400';
                        }
                        
                        const platformInfo = PLATFORM_INFO[event.extendedProps.platform as keyof typeof PLATFORM_INFO];
                        const timeStr = event.allDay ? '' : format(eventDate, 'HH:mm');

                        return (
                          <div 
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                            className={`px-1.5 py-1 rounded-md text-[11px] font-medium leading-snug flex items-center gap-1 shadow-sm cursor-pointer truncate ${bgClass}`} 
                            title={`${timeStr ? timeStr + ' • ' : ''}${event.title}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`}></span>
                            {timeStr && <span className="font-mono text-[10px] opacity-80">{timeStr}</span>}
                            <span className="truncate">{platformInfo?.icon} {event.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length === 0 && day.isCurrentMonth && (
                        <div className="flex items-center justify-center h-full pt-4 pointer-events-none">
                          <span className="text-[11px] text-zinc-400 italic">Kosong</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. KETERANGAN WARNA (LEGEND) */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Status Konten:</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-zinc-200 text-xs font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Dijadwalkan</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-zinc-900 text-xs font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Published</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>Menunggu Review</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 text-red-600 text-xs font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Terlambat / Overdue</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-500 text-xs font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                <span>Ide / Draft</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-blue-700 text-xs bg-blue-50 px-2.5 py-1 rounded-lg shadow-sm border border-blue-100">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Tip: Klik ganda pada sel tanggal untuk membuat jadwal instan.</span>
          </div>
        </div>

      </div>

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-5 py-4 border-b flex justify-between items-center" style={{ borderTop: `4px solid ${selectedEvent.color}` }}>
              <h3 className="font-bold text-lg text-zinc-900 truncate pr-4">{selectedEvent.title}</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-sm">
                <div className="text-zinc-500 font-medium">Status</div>
                <div className="col-span-2"><StatusBadge status={selectedEvent.extendedProps.status} /></div>
                
                <div className="text-zinc-500 font-medium">Platform</div>
                <div className="col-span-2 font-medium text-zinc-900 flex items-center gap-1">
                  {PLATFORM_INFO[selectedEvent.extendedProps.platform as keyof typeof PLATFORM_INFO]?.icon} 
                  {PLATFORM_INFO[selectedEvent.extendedProps.platform as keyof typeof PLATFORM_INFO]?.label || selectedEvent.extendedProps.platform}
                </div>
                
                <div className="text-zinc-500 font-medium">Pillar</div>
                <div className="col-span-2">
                  <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs font-bold text-zinc-700 uppercase">{selectedEvent.extendedProps.pillarName || '-'}</span>
                </div>

                <div className="text-zinc-500 font-medium">Assigned To</div>
                <div className="col-span-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                    {selectedEvent.extendedProps.assignedTo?.substring(0,2).toUpperCase()}
                  </div>
                  <span className="font-medium text-zinc-900">{selectedEvent.extendedProps.assignedTo}</span>
                </div>

                <div className="text-zinc-500 font-medium">Waktu Publish</div>
                <div className="col-span-2 font-mono text-zinc-700 bg-zinc-50 px-2 py-1 rounded inline-block">
                  {new Date(selectedEvent.start).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: selectedEvent.allDay ? undefined : 'short' })}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 bg-zinc-50 border-t flex justify-end gap-2">
              <button className="px-4 py-2 rounded-lg font-medium text-sm text-zinc-600 hover:bg-zinc-200 transition-colors" onClick={() => setSelectedEvent(null)}>Tutup</button>
              <Link href={`/contents?search=${encodeURIComponent(selectedEvent.title)}`}>
                <button className="px-4 py-2 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors">Lihat di Pipeline</button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SCHEDULE DRAWER */}
      {showQuickSchedule && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="material-symbols-outlined text-[24px]">edit_calendar</span>
                  <h3 className="font-bold text-xl text-zinc-900">Buat Jadwal Konten</h3>
                </div>
                <button 
                  className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 transition-colors" 
                  onClick={() => setShowQuickSchedule(false)} 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2 text-sm text-blue-700">
                  <span className="material-symbols-outlined text-[20px]">info</span>
                  <p>Ini adalah prototipe sinkronisasi cepat. Gunakan halaman <b>Buat Konten</b> utama untuk pengisian data lengkap.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase">Judul Konten / Post</label>
                  <input className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="Contoh: Tutorial Cold Brew 3 Langkah" type="text"/>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase">Tanggal Rilis</label>
                    <input className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" type="date" defaultValue={prefilledDate}/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase">Jam Tayang</label>
                    <input className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" type="time" defaultValue="10:00"/>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase">Klien Target</label>
                  <select className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                    <option>Kopi Kenangan Senja</option>
                    <option>SkinGlow Beauty Tech</option>
                    <option>UrbanStride Shoes</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase">Kanal Publikasi</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(PLATFORM_INFO).map(([k, v]) => (
                      <label key={k} className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
                        <input className="accent-blue-600 w-4 h-4" type="checkbox"/>
                        <span className="text-sm font-medium text-zinc-700">{v.icon} {v.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 mt-6">
              <button 
                className="px-4 py-2.5 rounded-xl text-zinc-600 hover:bg-zinc-100 text-sm font-semibold transition-colors" 
                onClick={() => setShowQuickSchedule(false)} 
                type="button"
              >
                Batal
              </button>
              <Link href="/contents?new=true">
                <button 
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]" 
                  onClick={() => setShowQuickSchedule(false)} 
                  type="button"
                >
                  Buka Form Lengkap
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
