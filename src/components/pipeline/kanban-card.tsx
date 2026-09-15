'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PLATFORM_INFO, PRIORITY_COLORS } from '@/lib/constants';
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
    opacity: isDragging ? 0.4 : 1,
  };

  const platformInfo = PLATFORM_INFO[content.platform as keyof typeof PLATFORM_INFO];
  const priorityColor = PRIORITY_COLORS[content.priority as keyof typeof PRIORITY_COLORS] || 'bg-zinc-200';
  // Extract border color from bg-xxx-yyy
  const borderClass = priorityColor.replace('bg-', 'border-').split(' ')[0].replace('-100', '-500'); 

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white p-3 rounded-md shadow-sm border-l-4 border-y border-r border-y-zinc-200 border-r-zinc-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${borderClass}`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className="font-semibold text-sm text-zinc-900 leading-tight line-clamp-2">{content.title}</h4>
        <span className="text-sm shrink-0" title={platformInfo?.label}>{platformInfo?.icon}</span>
      </div>
      
      <div className="flex justify-between items-end mt-4">
        <div className="text-xs text-zinc-500 font-medium">
          {content.publishDate ? formatDateShort(content.publishDate) : 'TBA'}
        </div>
        
        <div className="flex -space-x-1 overflow-hidden">
          {content.assignedTo ? (
            <div className="inline-block h-6 w-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white" title={content.assignedTo.name}>
              {content.assignedTo.name.substring(0,2).toUpperCase()}
            </div>
          ) : (
            <div className="inline-block h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] ring-2 ring-white" title="Unassigned">
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
