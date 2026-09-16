'use client';

import { useState, useEffect } from 'react';
import { KanbanBoard } from '@/components/pipeline/kanban-board';
import { PLATFORM_INFO, PRIORITY_LABELS } from '@/lib/constants';

export default function PipelinePage() {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchContents = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (platformFilter) params.append('platform', platformFilter);
    
    const res = await fetch(`/api/contents?${params.toString()}`);
    if (res.ok) {
      let data = await res.json();
      
      // Client-side fallback filtering if API doesn't support it yet
      if (priorityFilter) data = data.filter((c: any) => c.priority === priorityFilter);
      if (assigneeFilter) data = data.filter((c: any) => c.assignedToId === assigneeFilter);
      if (clientFilter) data = data.filter((c: any) => c.clientId === clientFilter);
      
      setContents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContents();
  }, [search, platformFilter, priorityFilter, assigneeFilter, clientFilter]);

  return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full flex flex-col">
      <div className="flex flex-col w-full flex-1">
        
        {/* Top Command & Action Bar */}
        <div className="px-6 pt-2 pb-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Subtitle */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-2xl text-zinc-900 tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[26px]">view_kanban</span>
                  Pipeline Konten
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                  LIVE SYNC
                </span>
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                Kelola alur kerja konten terpadu dari fase konsepsi, tinjauan klien, hingga analitik publikasi.
              </p>
            </div>
            
            {/* Actions & Views */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Switcher */}
              <div className="inline-flex p-1 bg-zinc-200/50 rounded-xl shadow-inner gap-1">
                <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-blue-600 text-sm font-medium shadow-sm" type="button">
                  <span className="material-symbols-outlined text-[17px]">view_kanban</span>
                  <span>Kanban</span>
                </button>
                <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-zinc-600 text-sm font-medium hover:text-zinc-900 transition-colors" type="button">
                  <span className="material-symbols-outlined text-[17px]">table_rows</span>
                  <span>Tabel</span>
                </button>
              </div>
              
              {/* Primary CTA: Create Content */}
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium shadow-md transition-all hover:-translate-y-0.5" type="button">
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Buat Konten</span>
              </button>
            </div>
          </div>
          
          {/* Filter Ribbon & Metrics Bar */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-zinc-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Inline Search */}
              <div className="relative min-w-[200px] flex-1 sm:flex-none">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-zinc-400">search</span>
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-sm bg-zinc-100 rounded-lg text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all border border-transparent focus:border-blue-500" 
                  placeholder="Cari konten... (⌘K)" 
                  type="text"
                />
              </div>
              
              {/* Platform Filter */}
              <div className="relative group">
                <select 
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="h-8 px-3 pr-8 inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700 text-sm font-medium transition-colors appearance-none cursor-pointer border-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Semua Platform</option>
                  {Object.entries(PLATFORM_INFO).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-zinc-500 pointer-events-none">expand_more</span>
              </div>

              {/* Priority Filter */}
              <div className="relative group">
                <select 
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="h-8 px-3 pr-8 inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700 text-sm font-medium transition-colors appearance-none cursor-pointer border-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Semua Prioritas</option>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-zinc-500 pointer-events-none">expand_more</span>
              </div>
              
              <button 
                onClick={() => { setSearch(''); setPlatformFilter(''); setPriorityFilter(''); setClientFilter(''); setAssigneeFilter(''); }}
                className="text-sm font-medium text-blue-600 hover:underline px-2 py-1 transition-colors" 
                type="button"
              >
                Reset Filter
              </button>
            </div>
            
            {/* Quick Status Metric */}
            <div className="flex items-center gap-3 self-end xl:self-center text-xs text-zinc-500 font-bold uppercase tracking-wider">
              <span className="inline-flex items-center gap-1.5 text-zinc-900">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {contents.length} Konten
              </span>
              <span>•</span>
              <span className="text-orange-600">
                {contents.filter(c => c.status === 'REVIEW').length} Butuh Review
              </span>
            </div>
          </div>
        </div>

        {/* Horizontal Kanban Board Canvas */}
        <div className="px-6 pb-8 overflow-x-auto select-none flex-1">
          {loading ? (
             <div className="flex h-full min-h-[300px] items-center justify-center text-zinc-500">
               <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
             </div>
          ) : (
            <KanbanBoard initialContents={contents} onStatusChange={fetchContents} />
          )}
        </div>

      </div>
    </div>
  );
}
