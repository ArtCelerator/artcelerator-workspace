'use client';

import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './kanban-card';

interface KanbanColumnProps {
  id: string;
  title: string;
  contents: any[];
  colorClass: string;
}

export function KanbanColumn({ id, title, contents, colorClass }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col w-80 shrink-0 bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden">
      <div className={`px-4 py-3 border-b flex justify-between items-center bg-white`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
          <h3 className="font-semibold text-sm text-zinc-700">{title}</h3>
        </div>
        <span className="bg-zinc-100 text-zinc-600 text-xs font-bold px-2 py-1 rounded-full">
          {contents.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`flex-1 p-3 overflow-y-auto space-y-3 min-h-[150px] transition-colors ${isOver ? 'bg-zinc-100' : ''}`}
      >
        {contents.map((content) => (
          <KanbanCard key={content.id} content={content} />
        ))}
      </div>
    </div>
  );
}
