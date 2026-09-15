# Artcelerator - Content & Agency OS

Sistem operasi (*Operating System*) terpusat yang dirancang khusus untuk agensi kreatif (*Creative Agency*). Aplikasi B2B SaaS ini membantu Anda dalam mengelola seluruh siklus produksi konten, manajemen klien, perencanaan proyek, integrasi ekosistem Google Workspace, hingga urusan penagihan dan keuangan.

## 🚀 Fitur Utama

- **📊 Dashboard Interaktif & Multi-Level Analytics**
  Melacak metrik *engagement* (Likes, Comments, Shares, Saves, Reach) per Klien, Proyek, hingga Kinerja Individu (*Team Member*).
  
- **🗓️ Content Management System (CMS)**
  Sistem Kalender Konten, Manajemen Status (*Drafting*, *Ready*, *Revision*, *Approved*, *Scheduled*, *Published*), *Content Pillar*, dan Notifikasi *Overdue*.

- **👥 Client & Project Management**
  Mengelola profil Klien, Kontak, Catatan, Anggaran (*Retainer*), dan Proyek Spesifik beserta status dan tanggal tenggat.

- **💰 Finance & Invoicing**
  Lacak arus kas (*Cash Flow*), pembayaran (*Payments*), dan pengeluaran (*Expenses*). Otomatis membuat dokumen **Invoice PDF** secara instan.

- **🤖 Google Workspace Integrations**
  - **Drive**: Pembuatan folder klien/proyek dan unggah file (*Attachment*) langsung.
  - **Sheets**: Ekspor data otomatis (*One-Way Sync*), laporan *Progress* klien langsung ke Spreadsheet.
  - **Docs**: Pembuatan dokumen otomatis (Brief, Proposal, Laporan Bulanan) dengan *Custom Template Engine* (seperti Mail Merge).

- **📱 Telegram Bot Notifications**
  Notifikasi *real-time* langsung ke genggaman Anda. Dilengkapi dengan fitur **Quiet Hours** agar tidur Anda tidak terganggu oleh notifikasi di malam hari.

## 💻 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **Database**: PostgreSQL (Supabase) + Prisma ORM (v5)
- **Authentication**: NextAuth.js (v5)
- **Integrations**: Google APIs (Drive, Sheets, Docs), Telegraf (Telegram Bot), @react-pdf/renderer
- **Charts**: Recharts

## 🛠️ Panduan Instalasi Lokal

1. **Clone repositori**
   \`\`\`bash
   git clone https://github.com/yourusername/artcelerator.git
   cd artcelerator
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Siapkan Environment Variables**
   Buat file \`.env\` di *root directory* dan isi dengan konfigurasi berikut:
   \`\`\`env
   DATABASE_URL="postgresql://postgres.[YOUR-SUPABASE-PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[YOUR-SUPABASE-PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

   AUTH_SECRET="random-string-sepanjang-32-karakter"
   NEXTAUTH_URL="http://localhost:3000"

   GOOGLE_CLIENT_ID="[OAUTH-CLIENT-ID].apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="[OAUTH-CLIENT-SECRET]"

   TELEGRAM_BOT_TOKEN="[YOUR-BOT-TOKEN]"
   CRON_SECRET="my-super-secret-cron-token"

   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   \`\`\`

4. **Jalankan Prisma Migrations**
   \`\`\`bash
   npx prisma migrate dev
   npx prisma generate
   \`\`\`

5. **Jalankan Server Development**
   \`\`\`bash
   npm run dev
   \`\`\`
   Aplikasi dapat diakses di \`http://localhost:3000\`.

## 🚀 Panduan Deployment (Vercel)

1. *Push* kode ke repositori GitHub.
2. Buka [Vercel](https://vercel.com/new) dan impor repositori.
3. Masukkan seluruh *Environment Variables* di atas.
4. **Penting:** Ubah \`NEXTAUTH_URL\` dan \`NEXT_PUBLIC_APP_URL\` menjadi URL domain Vercel Anda (misal: \`https://artcelerator.vercel.app\`).
5. Tambahkan ekstensi di \`.env\` untuk Google OAuth Redirect URIs di Google Cloud Console agar menyertakan domain Vercel.
6. Konfigurasi Telegram Webhook:
   Akses URL ini di *browser* Anda sekali saja:
   \`https://api.telegram.org/bot[TELEGRAM_BOT_TOKEN]/setWebhook?url=https://[YOUR_DOMAIN].vercel.app/api/telegram/webhook\`

---
*Dibuat oleh Tim Artcelerator. MVP v1.0.*
