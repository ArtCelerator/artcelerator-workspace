'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR, formatDateShort } from '@/lib/utils';
import { invoiceSchema, paymentSchema, expenseSchema } from '@/lib/validations';
import Link from 'next/link';

type Tab = 'OVERVIEW' | 'INVOICE' | 'PEMBAYARAN' | 'PENGELUARAN';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
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

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Keuangan</h1>
          <p className="text-zinc-500">Kelola invoice, pembayaran, dan pengeluaran.</p>
        </div>
      </div>

      <div className="border-b border-zinc-200 shrink-0 overflow-x-auto">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {(['OVERVIEW', 'INVOICE', 'PEMBAYARAN', 'PENGELUARAN'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${activeTab === tab ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'}
              `}
            >
              {tab === 'OVERVIEW' ? 'Overview' : tab === 'INVOICE' ? 'Invoice' : tab === 'PEMBAYARAN' ? 'Pembayaran' : 'Pengeluaran'}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {loading ? <p className="text-zinc-500">Memuat data keuangan...</p> : (
          <>
            {activeTab === 'OVERVIEW' && <TabOverview invoices={invoices} expenses={expenses} />}
            {activeTab === 'INVOICE' && <TabInvoices invoices={invoices} clients={clients} projects={projects} onUpdate={fetchData} />}
            {activeTab === 'PEMBAYARAN' && <TabPayments payments={payments} invoices={invoices} onUpdate={fetchData} />}
            {activeTab === 'PENGELUARAN' && <TabExpenses expenses={expenses} clients={clients} projects={projects} onUpdate={fetchData} />}
          </>
        )}
      </div>
    </div>
  );
}

function TabOverview({ invoices, expenses }: { invoices: any[], expenses: any[] }) {
  const totalRevenue = invoices.filter(i => i.status === 'PAID' || i.status === 'PARTIALLY_PAID').reduce((sum, i) => sum + Number(i.total), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpense;
  const outstanding = invoices.filter(i => i.status === 'SENT').reduce((sum, i) => sum + Number(i.total), 0);
  
  // Very rough overdue calculation (assuming today is 2026-09-14 as per prompt context, or just use new Date())
  const today = new Date();
  const overdue = invoices.filter(i => new Date(i.dueDate) < today && i.status !== 'PAID' && i.status !== 'CANCELLED' && i.status !== 'DRAFT').reduce((sum, i) => sum + Number(i.total), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card><CardHeader><CardTitle className="text-sm text-zinc-500">Total Pendapatan</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-700">{formatIDR(totalRevenue)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm text-zinc-500">Net Profit</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatIDR(netProfit)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm text-zinc-500">Total Pengeluaran</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatIDR(totalExpense)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm text-zinc-500">Outstanding (Belum Dibayar)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatIDR(outstanding)}</div></CardContent></Card>
      <Card className="border-red-200"><CardHeader><CardTitle className="text-sm text-red-500">Overdue (Jatuh Tempo)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatIDR(overdue)}</div></CardContent></Card>
    </div>
  );
}

function TabInvoices({ invoices, clients, projects, onUpdate }: any) {
  const [isOpen, setIsOpen] = useState(false);
  
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Daftar Invoice</h2>
        <Button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Batal' : '+ Buat Invoice'}</Button>
      </div>

      {isOpen && (
        <Card className="border-2 border-zinc-900 animate-in slide-in-from-top-4">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Klien</Label>
                  <select {...register('clientId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="">-- Pilih Klien --</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Proyek (Opsional)</Label>
                  <select {...register('projectId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="">-- Tanpa Proyek --</option>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Judul Invoice</Label><Input {...register('title')} placeholder="Contoh: Social Media Management Jan 2026" /></div>
                <div className="space-y-2"></div>
                <div className="space-y-2"><Label>Tanggal Terbit</Label><Input type="date" {...register('issueDate')} /></div>
                <div className="space-y-2"><Label>Jatuh Tempo</Label><Input type="date" {...register('dueDate')} /></div>
              </div>

              <div className="pt-4 border-t">
                <Label className="mb-2 block">Item Tagihan</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 mb-2 items-end">
                    <div className="flex-1 space-y-1"><Input {...register(`items.${index}.description`)} placeholder="Deskripsi" /></div>
                    <div className="w-20 space-y-1"><Input type="number" {...register(`items.${index}.quantity`)} placeholder="Qty" /></div>
                    <div className="w-40 space-y-1"><Input type="number" {...register(`items.${index}.unitPrice`)} placeholder="Harga Satuan" /></div>
                    <Button type="button" variant="ghost" onClick={() => remove(index)}>🗑️</Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>+ Tambah Item</Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Pajak (Rp)</Label><Input type="number" {...register('tax')} /></div>
                  <div className="space-y-2"><Label>Diskon (Rp)</Label><Input type="number" {...register('discount')} /></div>
                </div>
                <div className="bg-zinc-50 p-4 rounded-md space-y-2">
                  <div className="flex justify-between text-sm"><span>Subtotal:</span><span>{formatIDR(subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span>Pajak:</span><span>{formatIDR(Number(tax))}</span></div>
                  <div className="flex justify-between text-sm text-red-500"><span>Diskon:</span><span>-{formatIDR(Number(discount))}</span></div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2"><span>Total:</span><span>{formatIDR(grandTotal)}</span></div>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t"><Button type="submit">Simpan & Terbitkan</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b">
              <tr>
                <th className="px-4 py-3">No Invoice</th>
                <th className="px-4 py-3">Klien</th>
                <th className="px-4 py-3">Tanggal Terbit</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{inv.invoiceNo}</td>
                  <td className="px-4 py-3">{inv.client.name}</td>
                  <td className="px-4 py-3">{formatDateShort(inv.issueDate)}</td>
                  <td className="px-4 py-3">{formatDateShort(inv.dueDate)}</td>
                  <td className="px-4 py-3 font-medium">{formatIDR(inv.total)}</td>
                  <td className="px-4 py-3">
                    <span className="bg-zinc-100 px-2 py-1 rounded text-xs font-bold">{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right flex flex-col gap-1 items-end">
                    <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">Unduh PDF</a>
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
                    }} className="text-blue-600 hover:underline text-xs cursor-pointer bg-transparent border-none p-0 text-right">Cover Letter Docs</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

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
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-lg font-bold">Riwayat Pembayaran</h2><Button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Batal' : '+ Catat Pembayaran'}</Button></div>
      {isOpen && (
        <Card className="animate-in slide-in-from-top-4 border-2 border-zinc-900"><CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice</Label>
                <select {...register('invoiceId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">-- Pilih Invoice --</option>
                  {activeInvoices.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.invoiceNo} - {inv.client.name} ({formatIDR(inv.total)})</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Tanggal Bayar</Label><Input type="date" {...register('paidAt')} /></div>
              <div className="space-y-2"><Label>Jumlah (Rp)</Label><Input type="number" {...register('amount')} /></div>
              <div className="space-y-2"><Label>Metode</Label><Input {...register('method')} placeholder="Cth: BCA Transfer" /></div>
              <div className="space-y-2"><Label>Referensi</Label><Input {...register('reference')} placeholder="Cth: REF-123" /></div>
            </div>
            <div className="flex justify-end pt-2 border-t"><Button type="submit">Simpan Pembayaran</Button></div>
          </form>
        </CardContent></Card>
      )}
      <Card>
        <table className="w-full text-sm text-left"><thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b"><tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Klien</th><th className="px-4 py-3">Metode</th><th className="px-4 py-3 font-bold text-right">Jumlah</th></tr></thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} className="border-b"><td className="px-4 py-3">{formatDateShort(p.paidAt)}</td><td className="px-4 py-3">{p.invoice.invoiceNo}</td><td className="px-4 py-3">{p.invoice.client.name}</td><td className="px-4 py-3">{p.method}</td><td className="px-4 py-3 text-right font-medium text-green-700">{formatIDR(p.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function TabExpenses({ expenses, clients, projects, onUpdate }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(expenseSchema) });
  const onSubmit = async (data: any) => {
    const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) { toast.success('Pengeluaran dicatat'); reset(); setIsOpen(false); onUpdate(); }
    else toast.error('Gagal mencatat pengeluaran');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-lg font-bold">Pengeluaran Operasional</h2><Button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Batal' : '+ Catat Pengeluaran'}</Button></div>
      {isOpen && (
        <Card className="animate-in slide-in-from-top-4 border-2 border-zinc-900"><CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Kategori</Label><select {...register('category')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"><option value="ADS">Ads</option><option value="SOFTWARE">Software</option><option value="PRODUCTION">Produksi</option><option value="FREELANCER">Freelance</option><option value="MEALS">Meeting/Konsumsi</option><option value="TRANSPORT">Transport</option><option value="OTHER">Lainnya</option></select></div>
              <div className="space-y-2"><Label>Tanggal</Label><Input type="date" {...register('date')} /></div>
              <div className="space-y-2"><Label>Deskripsi</Label><Input {...register('description')} /></div>
              <div className="space-y-2"><Label>Jumlah (Rp)</Label><Input type="number" {...register('amount')} /></div>
              <div className="space-y-2"><Label>Klien (Opsional)</Label><select {...register('clientId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"><option value="">-- Bebas --</option>{clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="space-y-2"><Label>Proyek (Opsional)</Label><select {...register('projectId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"><option value="">-- Bebas --</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            </div>
            <div className="flex justify-end pt-2 border-t"><Button type="submit">Simpan Pengeluaran</Button></div>
          </form>
        </CardContent></Card>
      )}
      <Card>
        <table className="w-full text-sm text-left"><thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b"><tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Deskripsi</th><th className="px-4 py-3">Terkait</th><th className="px-4 py-3 font-bold text-right">Jumlah</th></tr></thead>
          <tbody>
            {expenses.map((e: any) => (
              <tr key={e.id} className="border-b"><td className="px-4 py-3">{formatDateShort(e.date)}</td><td className="px-4 py-3"><span className="bg-zinc-100 text-xs px-2 py-1 rounded font-bold">{e.category}</span></td><td className="px-4 py-3">{e.description}</td><td className="px-4 py-3 text-xs text-zinc-500">{e.client?.name} {e.project?.name ? `(${e.project.name})` : ''}</td><td className="px-4 py-3 text-right font-medium text-red-600">{formatIDR(e.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
