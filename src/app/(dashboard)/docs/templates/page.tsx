'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState('brief');
  const [content, setContent] = useState('');

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await fetch('/api/docs/templates');
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, type, content, isActive: true };
    const url = editingId ? `/api/docs/templates/${editingId}` : '/api/docs/templates';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });

    if (res.ok) {
      toast.success('Template berhasil disimpan');
      setIsFormOpen(false);
      setEditingId(null);
      resetForm();
      fetchTemplates();
    } else {
      toast.error('Gagal menyimpan template');
    }
  };

  const resetForm = () => {
    setName('');
    setType('brief');
    setContent('');
  };

  const handleEdit = (t: any) => {
    setName(t.name);
    setType(t.type);
    setContent(t.content || '');
    setEditingId(t.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus template ini?')) return;
    const res = await fetch(`/api/docs/templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Dihapus');
      fetchTemplates();
    }
  };

  const HINTS: Record<string, string> = {
    brief: '{{client}}, {{project}}, {{content_title}}, {{platform}}, {{deadline}}, {{pic}}',
    report: '{{client}}, {{month}}, {{year}}, {{total_content}}, {{engagement}}, {{reach}}, {{top_content}}, {{growth}}',
    proposal: '{{client}}, {{scope}}, {{deliverables}}, {{timeline}}, {{price}}, {{terms}}',
    invoice_cover: '{{client}}, {{invoice_no}}, {{month}}, {{amount|currency}}'
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold">📄 Template Dokumen</h1>
          <p className="text-zinc-500">Kelola template untuk Brief, Laporan, dan Proposal.</p>
        </div>
        <Button onClick={() => { setIsFormOpen(!isFormOpen); if(!isFormOpen) { resetForm(); setEditingId(null); } }}>
          {isFormOpen ? 'Batal' : '+ Buat Template'}
        </Button>
      </div>

      {isFormOpen && (
        <Card className="border-2 border-zinc-900 animate-in slide-in-from-top-4 shrink-0">
          <CardHeader><CardTitle>{editingId ? 'Edit Template' : 'Buat Template Baru'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Template</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Brief IG Reels" />
                </div>
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <select className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm" value={type} onChange={e => setType(e.target.value)}>
                    <option value="brief">Content Brief</option>
                    <option value="report">Monthly Report</option>
                    <option value="proposal">Project Proposal</option>
                    <option value="invoice_cover">Invoice Cover Letter</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 border border-blue-200">
                <strong>Variabel yang tersedia ({type}):</strong><br/>
                {HINTS[type]}
              </div>

              <div className="space-y-2">
                <Label>Konten Template (Teks Lengkap)</Label>
                <Textarea 
                  required 
                  rows={15} 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder={`Tulis isi dokumen di sini...\nGunakan variabel seperti {{client}} yang akan diganti otomatis nanti.`} 
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => toast.info('Preview belum tersedia')}>Preview</Button>
                <Button type="submit">Simpan Template</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <p>Memuat...</p>
        ) : templates.map(t => (
          <Card key={t.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{t.name}</CardTitle>
                <span className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono border">{t.type}</span>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-sm text-zinc-500 line-clamp-3 font-mono bg-zinc-50 p-2 rounded">{t.content}</p>
              <p className="text-xs text-zinc-400 mt-3">{t.variables?.length || 0} variabel terdeteksi</p>
            </CardContent>
            <CardFooter className="pt-0 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(t)}>Edit</Button>
              <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleDelete(t.id)}>Hapus</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
