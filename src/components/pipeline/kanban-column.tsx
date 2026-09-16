'use client';

import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './kanban-card';

interface KanbanColumnProps {
  id: string;
  title: string;
  icon: string;
  contents: any[];
  badgeColor: string;
  badgeText: string;
}

export function KanbanColumn({ id, title, icon, contents, badgeColor, badgeText }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className={`w-[310px] flex flex-col bg-zinc-100/80 rounded-2xl p-3 shadow-sm max-h-[calc(100vh-230px)] transition-colors border ${isOver ? 'border-blue-300 bg-blue-50/50' : 'border-transparent'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[16px]">{icon}</span>
          <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">{title}</h3>
          <span className={`px-2 py-0.5 rounded-full ${badgeColor} ${badgeText} text-xs font-bold`}>
            {contents.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-white transition-colors" type="button">
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
          <button className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-white transition-colors" type="button">
            <span className="material-symbols-outlined text-[16px]">more_horiz</span>
          </button>
        </div>
      </div>
      
      {/* Card Stream */}
      <div 
        ref={setNodeRef} 
        className="flex flex-col gap-2.5 overflow-y-auto pr-1 min-h-[100px] flex-1 no-scrollbar"
      >
        {contents.map((content) => (
          <KanbanCard key={content.id} content={content} />
        ))}
        {contents.length === 0 && id === 'ARCHIVED' && (
          <div className="flex-1 min-h-[150px] rounded-xl bg-white/60 flex flex-col items-center justify-center p-4 text-center border border-dashed border-zinc-200 mt-2">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-2 text-zinc-400">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
            <p className="text-[13px] text-zinc-900 font-medium">Belum ada arsip</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[180px]">
              Tarik kartu yang telah selesai ke kolom ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
