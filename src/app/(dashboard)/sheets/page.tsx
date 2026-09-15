'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function SheetsPage() {
  const [loading, setLoading] = useState(false);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/sheets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSync: true })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Spreadsheet berhasil dibuat!');
        window.open(data.url, '_blank');
      } else {
        toast.error(data.error || 'Gagal export data');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan');
    }
    setLoading(false);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const spreadsheetId = formData.get('spreadsheetId') as string;
    const sheetName = formData.get('sheetName') as string;

    if (!spreadsheetId || !sheetName) return toast.error('Lengkapi form import');

    setLoading(true);
    try {
      const res = await fetch('/api/sheets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          sheetName,
          columnMapping: { title: 'A', platform: 'B', publishDate: 'C', status: 'D' } // Basic default for MVP
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Berhasil mengimpor ${data.importedCount} baris data!`);
      } else {
        toast.error(data.error || 'Gagal import data');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold">📊 Google Sheets</h1>
          <p className="text-zinc-500">Sinkronisasi data otomatis dengan Google Sheets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export & Auto-Sync</CardTitle>
            <CardDescription>Buat Sheet baru dari seluruh data Konten Anda saat ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleExport} className="space-y-4">
              <p className="text-sm text-zinc-600">Spreadsheet baru akan dibuat di Google Drive Anda. Setiap perubahan data di aplikasi akan otomatis tersinkronisasi (One-Way Sync).</p>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Memproses...' : 'Generate New Sheet'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Data Lama</CardTitle>
            <CardDescription>Migrasi dari Sheet yang sudah ada.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Spreadsheet ID</label>
                <Input name="spreadsheetId" placeholder="1BxiMVs0X_x..." required />
                <p className="text-xs text-zinc-500 mt-1">Ambil dari URL Sheet Anda</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Nama Sheet</label>
                <Input name="sheetName" placeholder="Sheet1" required />
              </div>
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded">
                <strong>Catatan Pemetaan Kolom (Hardcoded MVP):</strong><br/>
                Kolom A: Judul<br/>
                Kolom B: Platform (INSTAGRAM/TIKTOK)<br/>
                Kolom C: Tanggal Publish (YYYY-MM-DD)<br/>
                Kolom D: Status (DRAFTING/PUBLISHED)
              </div>
              <Button type="submit" variant="secondary" disabled={loading} className="w-full">
                {loading ? 'Mengimpor...' : 'Mulai Import'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
