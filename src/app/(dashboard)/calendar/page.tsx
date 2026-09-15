'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/content/status-badge';
import Link from 'next/link';

// Dynamically import the wrapper to prevent SSR and Class constructor errors
const FullCalendarWrapper = dynamic(() => import('@/components/calendar/fullcalendar-wrapper'), { ssr: false, loading: () => <div className="p-8 text-center text-zinc-500">Memuat Kalender...</div> });

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const fetchEvents = async (info: any, successCallback: any, failureCallback: any) => {
    try {
      const res = await fetch(`/api/calendar?start=${encodeURIComponent(info.startStr)}&end=${encodeURIComponent(info.endStr)}`);
      if (res.ok) {
        const data = await res.json();
        successCallback(data);
      } else {
        failureCallback(new Error('Gagal memuat event'));
      }
    } catch (error) {
      failureCallback(error);
    }
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
  };

  const handleDateClick = (info: any) => {
    window.location.href = `/contents?date=${info.dateStr}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">📅 Kalender Konten</h1>
          <p className="text-zinc-500">Lihat jadwal publish konten Anda.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <FullCalendarWrapper
            events={fetchEvents}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4 flex-wrap text-sm text-zinc-600 justify-center">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10b981]"></div> Published</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#9333ea]"></div> Scheduled</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#eab308]"></div> Review</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div> Drafting</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#6b7280]"></div> Idea</div>
        <div className="text-xs text-zinc-400 ml-4">(Warna prioritas akan mengikuti Pillar jika diset)</div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderTop: `4px solid ${selectedEvent.backgroundColor}` }}>
              <h3 className="font-bold text-lg truncate pr-4">{selectedEvent.title}</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-zinc-400 hover:text-zinc-600">
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-zinc-500">Status</div>
                <div><StatusBadge status={selectedEvent.extendedProps.status} /></div>
                
                <div className="text-zinc-500">Platform</div>
                <div>{selectedEvent.extendedProps.platform}</div>
                
                <div className="text-zinc-500">Pillar</div>
                <div>{selectedEvent.extendedProps.pillarName || '-'}</div>

                <div className="text-zinc-500">Assigned To</div>
                <div>{selectedEvent.extendedProps.assignedTo}</div>

                <div className="text-zinc-500">Waktu Publish</div>
                <div>
                  {selectedEvent.start?.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: selectedEvent.allDay ? undefined : 'short' })}
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-zinc-50 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>Tutup</Button>
              <Link href={`/contents?search=${encodeURIComponent(selectedEvent.title)}`}>
                <Button>Buka di Konten</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
