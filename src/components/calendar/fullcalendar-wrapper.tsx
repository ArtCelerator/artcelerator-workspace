'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import idLocale from '@fullcalendar/core/locales/id';
import { PLATFORM_INFO } from '@/lib/constants';

interface CalendarWrapperProps {
  events: any; // Can be array or function
  onEventClick: (info: any) => void;
  onDateClick: (info: any) => void;
}

export default function FullCalendarWrapper({ events, onEventClick, onDateClick }: CalendarWrapperProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek'
      }}
      locale={idLocale}
      events={events}
      eventClick={onEventClick}
      dateClick={onDateClick}
      height="auto"
      eventContent={(arg) => {
        const platform = PLATFORM_INFO[arg.event.extendedProps.platform as keyof typeof PLATFORM_INFO];
        return (
          <div className="text-xs truncate px-1 font-medium text-white shadow-sm overflow-hidden flex items-center gap-1">
            <span>{platform?.icon}</span>
            <span className="truncate">{arg.timeText} {arg.event.title}</span>
          </div>
        );
      }}
    />
  );
}
