'use client';

import { useState, useEffect } from 'react';
import { KanbanBoard } from '@/components/pipeline/kanban-board';
import { Button } from '@/components/ui/button';
import { PLATFORM_INFO, PRIORITY_LABELS } from '@/lib/constants';

export default function PipelinePage() {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  const fetchContents = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (platformFilter) params.append('platform', platformFilter);

    // Also include ARCHIVED explicitly since API ignores it by default if status is not specified
    // Actually we will just fetch everything and the API needs to be adjusted, or we just rely on default API which excludes archived unless specified.
    // Let's modify the GET api in route to include ARCHIVED if explicitly asked, or we just don't show archived by default in Kanban to save space, but KanbanBoard has ARCHIVED column.
    
    const res = await fetch(`/api/contents?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setContents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContents();
  }, [search, platformFilter]);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-end border-b pb-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">🔄 Pipeline Konten</h1>
          <p className="text-zinc-500">Geser (drag & drop) konten untuk mengubah statusnya.</p>
        </div>
        
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="🔍 Cari konten..."
            className="flex h-9 w-48 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            value={platformFilter} 
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="flex h-9 w-40 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Semua Platform</option>
            {Object.entries(PLATFORM_INFO).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={() => { setSearch(''); setPlatformFilter(''); }}>Reset</Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-zinc-500">Memuat pipeline...</div>
        ) : (
          <KanbanBoard initialContents={contents} onStatusChange={fetchContents} />
        )}
      </div>
    </div>
  );
}
