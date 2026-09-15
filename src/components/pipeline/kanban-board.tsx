'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { toast } from 'sonner';
import { STATUS_LABELS } from '@/lib/constants';

const COLUMNS = [
  { id: 'IDEA', title: STATUS_LABELS['IDEA'], color: 'bg-zinc-400' },
  { id: 'DRAFTING', title: STATUS_LABELS['DRAFTING'], color: 'bg-blue-500' },
  { id: 'REVIEW', title: STATUS_LABELS['REVIEW'], color: 'bg-yellow-500' },
  { id: 'SCHEDULED', title: STATUS_LABELS['SCHEDULED'], color: 'bg-purple-500' },
  { id: 'PUBLISHED', title: STATUS_LABELS['PUBLISHED'], color: 'bg-emerald-500' },
  { id: 'ARCHIVED', title: STATUS_LABELS['ARCHIVED'], color: 'bg-zinc-600' },
];

export function KanbanBoard({ initialContents, onStatusChange }: { initialContents: any[], onStatusChange: () => void }) {
  const [contents, setContents] = useState(initialContents);

  useEffect(() => {
    setContents(initialContents);
  }, [initialContents]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const contentId = active.id as string;
    const newStatus = over.id as string;
    const content = contents.find(c => c.id === contentId);
    
    if (!content || content.status === newStatus) return;

    // Optimistic update
    setContents(prev => prev.map(c => c.id === contentId ? { ...c, status: newStatus } : c));

    try {
      const res = await fetch(`/api/contents/${contentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal mengubah status');
      }

      onStatusChange();
    } catch (error: any) {
      toast.error(error.message);
      // Revert optimistic update
      setContents(initialContents);
    }
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            colorClass={col.color}
            contents={contents.filter(c => c.status === col.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
