'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { toast } from 'sonner';

const COLUMNS = [
  { id: 'IDEA', title: 'IDE', icon: '💡', color: 'bg-zinc-200', textCol: 'text-zinc-700' },
  { id: 'DRAFTING', title: 'DRAFTING', icon: '✍️', color: 'bg-blue-100', textCol: 'text-blue-700' },
  { id: 'REVIEW', title: 'REVIEW', icon: '👀', color: 'bg-amber-100', textCol: 'text-amber-800' },
  { id: 'SCHEDULED', title: 'DIJADWALKAN', icon: '📅', color: 'bg-indigo-100', textCol: 'text-indigo-800' },
  { id: 'PUBLISHED', title: 'PUBLISHED', icon: '✅', color: 'bg-emerald-100', textCol: 'text-emerald-800' },
  { id: 'ARCHIVED', title: 'ARSIP', icon: '📦', color: 'bg-zinc-200', textCol: 'text-zinc-600' },
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
      <div className="flex gap-4 min-w-max items-start h-full pb-4">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            icon={col.icon}
            badgeColor={col.color}
            badgeText={col.textCol}
            contents={contents.filter(c => c.status === col.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
