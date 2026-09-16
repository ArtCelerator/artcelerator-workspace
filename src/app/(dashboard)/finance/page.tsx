'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { formatIDR, formatDateShort } from '@/lib/utils';
import { invoiceSchema, paymentSchema, expenseSchema } from '@/lib/validations';
import Link from 'next/link';

type Tab = 'INVOICE' | 'PEMBAYARAN' | 'PENGELUARAN';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('INVOICE');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [invRes, payRes, expRes, cliRes, projRes] = await Promise.all([
      fetch('/api/invoices'),
      fetch('/api/payments'),
      fetch('/api/expenses'),
      fetch('/api/clients'),
      fetch('/api/projects')
    ]);
    if (invRes.ok) setInvoices(await invRes.json());
    if (payRes.ok) setPayments(await payRes.json());
    if (expRes.ok) setExpenses(await expRes.json());
    if (cliRes.ok) setClients(await cliRes.json());
    if (projRes.ok) setProjects(await projRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // CALCULATIONS
  const totalRevenue = invoices.filter(i => i.status === 'PAID' || i.status === 'PARTIALLY_PAID').reduce((sum, i) => sum + Number(i.total), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpense;
  const outstanding = invoices.filter(i => i.status === 'SENT').reduce((sum, i) => sum + Number(i.total), 0);
  
  const today = new Date();
  const overdueInvoices = invoices.filter(i => new Date(i.dueDate) < today && i.status !== 'PAID' && i.status !== 'CANCELLED' && i.status !== 'DRAFT');
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + Number(i.total), 0);
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  return (
    <div className="relative pt-6 min-h-screen bg-zinc-50 w-full">
      <div className="px-6 space-y-6 max-w-[1520px] mx-auto w-full pb-10">
        
        {/* 1. HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Finansial & Cashflow</span>
              <span className="opacity-40 font-mono text-[10px]">•</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Periode Aktif</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl text-zinc-900 font-bold tracking-tight flex items-center gap-2">
                <span>💰</span>
                <span>Keuangan</span>
              </h1>
              <span className="bg-zinc-200 text-blue-600 font-mono text-xs px-2.5 py-0.5 rounded-full font-semibold">IDR / Rp</span>
            </div>
            <p className="text-sm text-zinc-500 max-w-2xl">
              Kelola tagihan invoice, catat pembayaran, pengeluaran produksi, dan pantau likuiditas kas operasional agensi secara real-time.
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-zinc-50 text-zinc-900 rounded-xl text-sm font-semibold shadow-sm border border-zinc-200 transition-all duration-150 active:scale-[0.98]" type="button">
              <span className="material-symbols-outlined text-[18px] text-zinc-500">download</span>
              <span>Unduh Rekap (CSV)</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-150 active:scale-[0.98]" type="button" onClick={() => document.getElementById('btn-add-invoice')?.click()}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Buat Invoice</span>
            </button>
          </div>
        </div>

        {/* 2. RINGKASAN KEUANGAN: 5 METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Pendapatan */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200 hover:-translate-y-0.5 transition-transform duration-200 flex flex-col justify-between min-h-[148px]">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pendapatan Diterima</span>
              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Realized</span>
            </div>
            <div className="my-1">
              <div className="text-2xl font-bold text-zinc-900 tracking-tight">{formatIDR(totalRevenue)}</div>
            </div>
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span>MRR Terkumpul</span>
            </div>
          </div>

          {/* Card 2: Outstanding */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200 hover:-translate-y-0.5 transition-transform duration-200 flex flex-col justify-between min-h-[148px]">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Belum Dibayar</span>
              <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{invoices.filter(i => i.status === 'SENT').length} Invoice</span>
            </div>
            <div className="my-1">
              <div className="text-2xl font-bold text-amber-600 tracking-tight">{formatIDR(outstanding)}</div>
            </div>
            <div className="text-xs font-medium text-zinc-500">
              Menunggu jatuh tempo (Outstanding)
            </div>
          </div>

          {/* Card 3: Overdue */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200 hover:-translate-y-0.5 transition-transform duration-200 flex flex-col justify-between min-h-[148px]">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Overdue</span>
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{overdueInvoices.length} Jatuh Tempo</span>
            </div>
            <div className="my-1">
              <div className="text-2xl font-bold text-red-600 tracking-tight">{formatIDR(overdueAmount)}</div>
            </div>
            <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              <span>Perlu follow up PIC</span>
            </div>
          </div>

          {/* Card 4: Expense */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200 hover:-translate-y-0.5 transition-transform duration-200 flex flex-col justify-between min-h-[148px]">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pengeluaran</span>
              <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2 py-0.5 rounded-full">All-time</span>
            </div>
            <div className="my-1">
              <div className="text-2xl font-bold text-zinc-700 tracking-tight">{formatIDR(totalExpense)}</div>
            </div>
            <div className="text-xs font-medium text-zinc-500 truncate">
              Talent, Ads, & Software
            </div>
          </div>

          {/* Card 5: Profit */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md hover:-translate-y-0.5 transition-transform duration-200 flex flex-col justify-between min-h-[148px]">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profit Bersih</span>
              <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Margin {profitMargin}%</span>
            </div>
            <div className="my-1">
              <div className="text-2xl font-bold text-white tracking-tight">{formatIDR(netProfit)}</div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
              <span className="material-symbols-outlined text-[15px] text-emerald-400">verified</span>
              <span className="truncate">Kesehatan kas berjalan</span>
            </div>
          </div>
        </div>

        {/* 3. TABS NAVIGATION & QUICK FILTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl px-4 py-2 shadow-sm border border-zinc-200">
          <div className="flex items-center gap-4 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('INVOICE')}
              className={`flex items-center gap-1.5 py-2 relative text-sm font-semibold ${activeTab === 'INVOICE' ? 'text-blue-600' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Invoice Tagihan</span>
              <span className={`ml-1 font-mono text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'INVOICE' ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>{invoices.length}</span>
              {activeTab === 'INVOICE' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('PEMBAYARAN')}
              className={`flex items-center gap-1.5 py-2 relative text-sm font-semibold ${activeTab === 'PEMBAYARAN' ? 'text-blue-600' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              <span>Pembayaran Masuk</span>
              {activeTab === 'PEMBAYARAN' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('PENGELUARAN')}
              className={`flex items-center gap-1.5 py-2 relative text-sm font-semibold ${activeTab === 'PENGELUARAN' ? 'text-blue-600' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <span className="material-symbols-outlined text-[18px]">outbox</span>
              <span>Pengeluaran Operasional</span>
              {activeTab === 'PENGELUARAN' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full"></div>}
            </button>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto py-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-500 text-xs font-medium">
              <span className="material-symbols-outlined text-[16px] text-blue-600">calendar_month</span>
              <span>Periode: <strong className="text-zinc-900">Semua Waktu</strong></span>
            </div>
          </div>
        </div>

        {/* 4. TAB KONTEN */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500 font-medium animate-pulse">Memuat data keuangan...</div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'INVOICE' && <TabInvoices invoices={invoices} clients={clients} projects={projects} onUpdate={fetchData} />}
            {activeTab === 'PEMBAYARAN' && <TabPayments payments={payments} invoices={invoices} onUpdate={fetchData} />}
            {activeTab === 'PENGELUARAN' && <TabExpenses expenses={expenses} clients={clients} projects={projects} onUpdate={fetchData} />}
          </div>
        )}

        {/* 5. BAGIAN TAMBAHAN: BANK INFO (Selalu tampil di bawah) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8 pt-6 border-t border-zinc-200">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200 flex flex-col justify-between">
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[22px]">account_balance_wallet</span>
                  <h2 className="text-lg font-bold text-zinc-900">Informasi Rekening Pembayaran</h2>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 tracking-wider">VERIFIKASI RESMI</span>
              </div>
              <p className="text-sm text-zinc-500">
                Semua tagihan resmi dialirkan langsung ke rekening virtual agensi terpusat:
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl relative group hover:bg-blue-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-blue-600">BCA Giro Agensi</span>
                  <span className="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-blue-600 transition-colors cursor-pointer" title="Salin Rekening">content_copy</span>
                </div>
                <div className="font-mono font-bold text-zinc-900 tracking-wide">882-0192-381</div>
                <div className="text-xs font-medium text-zinc-500 mt-1 truncate">a.n. PT Artcelerator Kreasi Digital</div>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl relative group hover:bg-amber-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-amber-600">Mandiri Corporate</span>
                  <span className="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-amber-600 transition-colors cursor-pointer" title="Salin Rekening">content_copy</span>
                </div>
                <div className="font-mono font-bold text-zinc-900 tracking-wide">137-00-2918-201</div>
                <div className="text-xs font-medium text-zinc-500 mt-1 truncate">a.n. PT Artcelerator Kreasi Digital</div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-xl flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-blue-700 font-medium">
                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                <span className="text-xs">Mendukung QRIS Dinamis & Virtual Account</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200 flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500 text-[22px]">event_upcoming</span>
                  <h2 className="text-lg font-bold text-zinc-900">Jadwal Settlement Terdekat</h2>
                </div>
              </div>
              <p className="text-sm text-zinc-500">Estimasi pencairan dana dari invoice klien (Overdue / Mendekati Deadline):</p>
            </div>
            
            <div className="space-y-3">
              {overdueInvoices.length > 0 ? overdueInvoices.slice(0,3).map(inv => (
                <div key={inv.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-900 truncate">Pelunasan {inv.client.name}</span>
                      <span className="font-mono font-bold text-red-600 text-sm">{formatIDR(inv.total)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-red-500 font-medium">
                      <span>{inv.invoiceNo}</span>
                      <span>•</span>
                      <span>Overdue {formatDateShort(inv.dueDate)}</span>
                    </div>
                  </div>
                </div>
              )) : (
                 <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center text-sm font-medium text-zinc-500">Tidak ada jadwal mendesak.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB 1: INVOICE TAGIHAN
// -----------------------------------------------------------------------------

function TabInvoices({ invoices, clients, projects, onUpdate }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  type InvoiceFormData = z.infer<typeof invoiceSchema>;
  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { title: '', tax: 0, discount: 0, items: [{ description: '', quantity: 1, unitPrice: 0 }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items') || [];
  const tax = watch('tax') || 0;
  const discount = watch('discount') || 0;
  const subtotal = watchedItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
  const grandTotal = subtotal + Number(tax) - Number(discount);

  const onSubmit = async (data: any) => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      toast.success('Invoice berhasil dibuat');
      reset();
      setIsOpen(false);
      onUpdate();
    } else toast.error('Gagal membuat invoice');
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'bg-zinc-100 text-zinc-600';
      case 'SENT': return 'bg-blue-100 text-blue-700 ping';
      case 'PARTIALLY_PAID': return 'bg-amber-100 text-amber-700';
      case 'PAID': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'DRAFT';
      case 'SENT': return 'DIKIRIM';
      case 'PARTIALLY_PAID': return 'SEBAGIAN';
      case 'PAID': return 'LUNAS';
      case 'CANCELLED': return 'BATAL';
      default: return status;
    }
  };

  const filteredInvoices = invoices.filter((i:any) => i.invoiceNo.toLowerCase().includes(search.toLowerCase()) || i.client.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col animate-in fade-in">
      {/* TOOLBAR */}
      <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400 text-[18px]">search</span>
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white text-zinc-900 text-sm font-medium rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-400 shadow-inner" 
              placeholder="Cari No. Invoice atau Klien..." 
              type="text"
            />
          </div>
          <button id="btn-add-invoice" onClick={() => setIsOpen(!isOpen)} className="hidden">Buat</button>
        </div>
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          MENAMPILKAN <span className="text-zinc-900">{filteredInvoices.length}</span> INVOICE
        </div>
      </div>

      {/* CREATE FORM */}
      {isOpen && (
        <div className="p-6 bg-zinc-50 border-b border-zinc-200 shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Buat Invoice Baru</h3>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-900"><span className="material-symbols-outlined">close</span></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Klien</label><select {...register('clientId')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm"><option value="">-- Pilih Klien --</option>{clients.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Proyek (Opsional)</label><select {...register('projectId')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm"><option value="">-- Tanpa Proyek --</option>{projects.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Judul Invoice</label><input {...register('title')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" placeholder="Contoh: Pembayaran Q3" /></div>
              <div className="space-y-1.5"></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tanggal Terbit</label><input type="date" {...register('issueDate')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Jatuh Tempo</label><input type="date" {...register('dueDate')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" /></div>
            </div>

            <div className="pt-4 border-t border-zinc-200">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Item Tagihan</label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 mb-2 items-end">
                  <div className="flex-1 space-y-1"><input {...register(`items.${index}.description` as const)} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" placeholder="Deskripsi item" /></div>
                  <div className="w-24 space-y-1"><input type="number" {...register(`items.${index}.quantity` as const)} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" placeholder="Qty" /></div>
                  <div className="w-48 space-y-1"><input type="number" {...register(`items.${index}.unitPrice` as const)} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" placeholder="Harga Satuan" /></div>
                  <button type="button" onClick={() => remove(index)} className="h-10 px-3 text-red-500 hover:bg-red-50 rounded-lg"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                </div>
              ))}
              <button type="button" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })} className="mt-2 text-sm font-semibold text-blue-600 hover:underline">+ Tambah Item</button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200">
              <div className="space-y-4">
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pajak (Rp)</label><input type="number" {...register('tax')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Diskon (Rp)</label><input type="number" {...register('discount')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" /></div>
              </div>
              <div className="bg-white border border-zinc-200 p-4 rounded-xl space-y-2 shadow-sm">
                <div className="flex justify-between text-sm font-medium text-zinc-500"><span>Subtotal:</span><span>{formatIDR(subtotal)}</span></div>
                <div className="flex justify-between text-sm font-medium text-zinc-500"><span>Pajak:</span><span>{formatIDR(Number(tax))}</span></div>
                <div className="flex justify-between text-sm font-medium text-red-500"><span>Diskon:</span><span>-{formatIDR(Number(discount))}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-zinc-100 mt-2 text-zinc-900"><span>Total:</span><span>{formatIDR(grandTotal)}</span></div>
              </div>
            </div>
            <div className="flex justify-end pt-4"><button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700">Simpan & Terbitkan</button></div>
          </form>
        </div>
      )}

      {/* TABLE */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-50 text-zinc-500 text-[10px] uppercase font-bold tracking-wider border-b border-zinc-200">
              <th className="py-3 px-4">NO. INVOICE</th>
              <th className="py-3 px-4">KLIEN & PROYEK</th>
              <th className="py-3 px-4">TANGGAL & TEMPO</th>
              <th className="py-3 px-4">TOTAL TAGIHAN</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredInvoices.map((inv: any) => {
              const isOverdue = new Date(inv.dueDate) < new Date() && inv.status !== 'PAID' && inv.status !== 'CANCELLED';
              const style = isOverdue ? 'bg-red-100 text-red-700 ping' : getStatusStyle(inv.status);
              const label = isOverdue ? 'OVERDUE' : getStatusLabel(inv.status);
              const hasPing = style.includes('ping');

              return (
                <tr key={inv.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[18px] ${isOverdue ? 'text-red-500' : 'text-zinc-400'}`}>receipt</span>
                      <span className={`font-mono font-bold ${isOverdue ? 'text-red-600' : 'text-zinc-900'}`}>{inv.invoiceNo}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-zinc-900 truncate">{inv.client.name}</span>
                      <span className="text-zinc-500 text-xs truncate">{inv.title || 'Invoice Klien'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-zinc-900 font-medium text-xs">{formatDateShort(inv.issueDate)}</span>
                      <span className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${isOverdue ? 'text-red-500' : 'text-zinc-500'}`}>
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        <span>Due: {formatDateShort(inv.dueDate)}</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-900">{formatIDR(inv.total)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${style.replace(' ping', '')}`}>
                      {hasPing && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOverdue ? 'bg-red-500' : 'bg-blue-600'}`}></span>}
                      {label}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" className="px-2 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                        <span>PDF</span>
                      </a>
                      <button onClick={async () => {
                        const resT = await fetch('/api/docs/templates');
                        const temps = await resT.json();
                        const t = temps.find((x:any)=>x.type==='invoice_cover');
                        if(!t) return alert('Template cover letter belum dibuat');
                        const resG = await fetch('/api/docs/generate', {
                          method: 'POST',
                          headers: {'Content-Type':'application/json'},
                          body: JSON.stringify({templateId: t.id, invoiceId: inv.id, clientId: inv.clientId})
                        });
                        const data = await resG.json();
                        if(data.docUrl) window.open(data.docUrl, '_blank');
                      }} className="px-2 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-blue-600 text-xs font-semibold inline-flex items-center gap-1 transition-colors">
                        <span>Cover</span>
                        <span className="material-symbols-outlined text-[14px]">description</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredInvoices.length === 0 && (
               <tr><td colSpan={6} className="py-10 text-center text-zinc-500 font-medium">Tidak ada data invoice.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB 2: PEMBAYARAN MASUK
// -----------------------------------------------------------------------------

function TabPayments({ payments, invoices, onUpdate }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, method: 'BANK_TRANSFER' }
  });

  const onSubmit = async (data: any) => {
    const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) { toast.success('Pembayaran dicatat'); reset(); setIsOpen(false); onUpdate(); }
    else toast.error('Gagal mencatat pembayaran');
  };

  const activeInvoices = invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col animate-in fade-in">
      <div className="p-4 bg-white flex items-center justify-between border-b border-zinc-200">
        <h2 className="text-lg font-bold text-zinc-900">Riwayat Pembayaran Masuk</h2>
        <button onClick={() => setIsOpen(!isOpen)} className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-100 transition-colors">{isOpen ? 'Batal' : '+ Catat Pembayaran'}</button>
      </div>
      {isOpen && (
        <div className="p-6 bg-zinc-50 border-b border-zinc-200 shadow-inner">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Invoice Terkait</label>
                <select {...register('invoiceId')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm">
                  <option value="">-- Pilih Invoice --</option>
                  {activeInvoices.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.invoiceNo} - {inv.client.name} ({formatIDR(inv.total)})</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tanggal Bayar</label><input type="date" {...register('paidAt')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Jumlah (Rp)</label><input type="number" {...register('amount')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Metode (Bank/Channel)</label><input {...register('method')} placeholder="Cth: BCA Transfer / QRIS" className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" /></div>
              <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Nomor Referensi Transaksi</label><input {...register('reference')} placeholder="Cth: REF-12345" className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" /></div>
            </div>
            <div className="flex justify-end pt-2"><button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700">Simpan Catatan</button></div>
          </form>
        </div>
      )}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-50 text-zinc-500 text-[10px] uppercase font-bold tracking-wider border-b border-zinc-200">
              <th className="py-3 px-4">TANGGAL</th><th className="py-3 px-4">NO INVOICE</th><th className="py-3 px-4">KLIEN</th><th className="py-3 px-4">METODE</th><th className="py-3 px-4 text-right">JUMLAH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {payments.map((p: any) => (
              <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                <td className="py-4 px-4 font-medium text-zinc-900">{formatDateShort(p.paidAt)}</td>
                <td className="py-4 px-4"><span className="font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded text-xs">{p.invoice.invoiceNo}</span></td>
                <td className="py-4 px-4 font-medium text-zinc-700">{p.invoice.client.name}</td>
                <td className="py-4 px-4 text-zinc-500">{p.method}</td>
                <td className="py-4 px-4 text-right font-bold text-emerald-600">{formatIDR(p.amount)}</td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-zinc-500 font-medium">Belum ada data pembayaran.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB 3: PENGELUARAN
// -----------------------------------------------------------------------------

function TabExpenses({ expenses, clients, projects, onUpdate }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(expenseSchema) });
  const onSubmit = async (data: any) => {
    const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) { toast.success('Pengeluaran dicatat'); reset(); setIsOpen(false); onUpdate(); }
    else toast.error('Gagal mencatat pengeluaran');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col animate-in fade-in">
      <div className="p-4 bg-white flex items-center justify-between border-b border-zinc-200">
        <h2 className="text-lg font-bold text-zinc-900">Pengeluaran Operasional</h2>
        <button onClick={() => setIsOpen(!isOpen)} className="px-4 py-2 bg-orange-50 text-orange-700 font-bold text-sm rounded-xl hover:bg-orange-100 transition-colors">{isOpen ? 'Batal' : '+ Catat Pengeluaran'}</button>
      </div>
      {isOpen && (
        <div className="p-6 bg-zinc-50 border-b border-zinc-200 shadow-inner">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Kategori</label>
                <select {...register('category')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm">
                  <option value="ADS">Ads / Iklan</option>
                  <option value="SOFTWARE">Software / Tools</option>
                  <option value="PRODUCTION">Produksi Konten</option>
                  <option value="FREELANCER">Talent / Freelance</option>
                  <option value="MEALS">Meeting / Konsumsi</option>
                  <option value="TRANSPORT">Transportasi</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tanggal</label><input type="date" {...register('date')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Klien Terkait (Opsional)</label><select {...register('clientId')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm"><option value="">-- Bebas --</option>{clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Proyek Terkait (Opsional)</label><select {...register('projectId')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm"><option value="">-- Bebas --</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Deskripsi Pembelian</label><input {...register('description')} placeholder="Cth: Langganan Adobe CC" className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" /></div>
              <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Jumlah (Rp)</label><input type="number" {...register('amount')} className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm" /></div>
            </div>
            <div className="flex justify-end pt-2"><button type="submit" className="px-5 py-2.5 bg-orange-600 text-white rounded-xl font-bold shadow-md hover:bg-orange-700">Simpan Pengeluaran</button></div>
          </form>
        </div>
      )}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-50 text-zinc-500 text-[10px] uppercase font-bold tracking-wider border-b border-zinc-200">
              <th className="py-3 px-4">TANGGAL</th><th className="py-3 px-4">KATEGORI</th><th className="py-3 px-4">DESKRIPSI</th><th className="py-3 px-4">TERKAIT</th><th className="py-3 px-4 text-right">JUMLAH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {expenses.map((e: any) => (
              <tr key={e.id} className="hover:bg-zinc-50 transition-colors">
                <td className="py-4 px-4 font-medium text-zinc-900">{formatDateShort(e.date)}</td>
                <td className="py-4 px-4"><span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">{e.category}</span></td>
                <td className="py-4 px-4 text-zinc-700 font-medium">{e.description}</td>
                <td className="py-4 px-4 text-xs text-zinc-500">{e.client?.name || '-'} {e.project?.name ? `(${e.project.name})` : ''}</td>
                <td className="py-4 px-4 text-right font-bold text-red-600">{formatIDR(e.amount)}</td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-zinc-500 font-medium">Belum ada data pengeluaran.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
