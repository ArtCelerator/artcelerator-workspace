'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PLATFORM_INFO, CONTENT_TYPE_INFO } from '@/lib/constants';
import { formatDateShort } from '@/lib/utils';
import Link from 'next/link';

export function KanbanCard({ content }: { content: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: content.id,
    data: {
      type: 'Content',
      content,
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const platformInfo = PLATFORM_INFO[content.platform as keyof typeof PLATFORM_INFO];
  const typeInfo = CONTENT_TYPE_INFO[content.contentType as keyof typeof CONTENT_TYPE_INFO];

  // Priority edge color
  let edgeColor = 'bg-zinc-200';
  if (content.priority === 'HIGH') edgeColor = 'bg-orange-500';
  else if (content.priority === 'URGENT') edgeColor = 'bg-red-500';
  else if (content.priority === 'MEDIUM') edgeColor = 'bg-amber-400';
  else if (content.priority === 'LOW') edgeColor = 'bg-blue-400';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative overflow-hidden flex flex-col gap-2 ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'hover:-translate-y-0.5 border border-zinc-200/60'}`}
    >
      {/* Left priority indicator bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${edgeColor}`}></div>
      
      {/* Header: Platform & Format */}
      <div className="flex items-center justify-between pl-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
          <span title={platformInfo?.label}>{platformInfo?.icon}</span>
          <span>{platformInfo?.label}</span>
          {typeInfo && <span className="text-zinc-400">• {typeInfo.label}</span>}
        </span>
        <span className="material-symbols-outlined text-[16px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">drag_indicator</span>
      </div>
      
      {/* Title */}
      <h4 className="text-sm font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors line-clamp-2 pl-1 leading-snug">
        {content.title}
      </h4>
      
      {/* Pillar & Tags */}
      <div className="flex flex-wrap items-center gap-1.5 pl-1">
        {content.pillar && (
          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-bold uppercase">
            {content.pillar.name}
          </span>
        )}
        {content.client && (
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
            {content.client.name}
          </span>
        )}
        {content.priority === 'URGENT' && (
          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase">
            URGENT
          </span>
        )}
      </div>
      
      {/* Footer: Assignee & Date */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 mt-1 pl-1">
        <div className="flex items-center gap-1.5">
          {content.assignedTo ? (
            <>
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold" title={content.assignedTo.name}>
                {content.assignedTo.name.substring(0,2).toUpperCase()}
              </div>
              <span className="text-[12px] text-zinc-500 font-medium">{content.assignedTo.name.split(' ')[0]}</span>
            </>
          ) : (
             <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-500 text-[10px] flex items-center justify-center font-bold border border-zinc-300 border-dashed">
                ?
              </div>
          )}
        </div>
        <div className={`flex items-center gap-1 font-mono text-[11px] font-semibold ${content.priority === 'URGENT' ? 'text-red-600' : 'text-zinc-500'}`}>
          <span className="material-symbols-outlined text-[14px]">
            {content.status === 'PUBLISHED' ? 'check_circle' : 'event'}
          </span>
          <span>{content.publishDate ? formatDateShort(content.publishDate) : 'TBA'}</span>
        </div>
      </div>
    </div>
  );
}
