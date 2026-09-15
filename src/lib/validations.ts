import { z } from 'zod';

export const contentCreateSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  contentType: z.enum(['BLOG', 'VIDEO', 'INFOGRAPHIC', 'SOCIAL_POST', 'STORY', 'REEL', 'PODCAST', 'NEWSLETTER', 'CAROUSEL', 'THREAD']),
  platform: z.enum(['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER', 'LINKEDIN', 'FACEBOOK', 'THREADS', 'PINTEREST', 'BLOG', 'EMAIL']),
  pillarId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  campaignId: z.string().nullable().optional(),
  publishDate: z.string().nullable().optional(), // format YYYY-MM-DD expected
  publishTime: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignedToId: z.string().nullable().optional(),
});

export const contentUpdateSchema = contentCreateSchema.partial();

export const contentStatusSchema = z.object({
  status: z.enum(['IDEA', 'DRAFTING', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']),
});

export const pillarSchema = z.object({
  name: z.string().min(2, "Nama pillar minimal 2 karakter"),
  description: z.string().nullable().optional(),
  percentage: z.number().min(0).max(100),
  color: z.string(),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
});

export const clientSchema = z.object({
  name: z.string().min(2, "Nama klien minimal 2 karakter"),
  industry: z.string().nullable().optional(),
  website: z.string().url("Format URL tidak valid").or(z.literal('')).nullable().optional(),
  status: z.enum(['LEAD', 'PROSPECT', 'ACTIVE', 'PAUSED', 'CHURNED']).default('LEAD'),
  contractStart: z.string().nullable().optional(),
  contractEnd: z.string().nullable().optional(),
  monthlyRetainer: z.coerce.number().nullable().optional(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const clientContactSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  position: z.string().nullable().optional(),
  email: z.string().email("Email tidak valid").nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  isPrimary: z.boolean().default(false),
});

export const clientNoteSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter"),
  content: z.string().min(1, "Konten wajib diisi"),
});

export const projectSchema = z.object({
  name: z.string().min(3, "Nama proyek minimal 3 karakter"),
  clientId: z.string().min(1, "Klien wajib dipilih"),
  description: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  budget: z.coerce.number().nullable().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).default('PLANNING'),
  deliverables: z.any().optional(), // Expected JSON
});

export const projectMemberSchema = z.object({
  userId: z.string().min(1, "User wajib dipilih"),
  role: z.string().nullable().optional(),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi"),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Klien wajib dipilih"),
  projectId: z.string().nullable().optional(),
  title: z.string().min(3, "Judul invoice minimal 3 karakter"),
  issueDate: z.string().min(1, "Tanggal issue wajib diisi"),
  dueDate: z.string().min(1, "Tanggal due wajib diisi"),
  items: z.array(invoiceItemSchema).min(1, "Minimal 1 item"),
  tax: z.coerce.number().default(0),
  discount: z.coerce.number().default(0),
  notes: z.string().nullable().optional(),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice wajib dipilih"),
  amount: z.coerce.number().min(1, "Jumlah pembayaran wajib diisi"),
  method: z.string().min(1, "Metode wajib diisi"),
  reference: z.string().nullable().optional(),
  paidAt: z.string().min(1, "Tanggal bayar wajib diisi"),
  notes: z.string().nullable().optional(),
});

export const expenseSchema = z.object({
  category: z.enum(['ADS', 'TOOLS', 'FREELANCER', 'PRODUCTION', 'TRANSPORT', 'MEALS', 'SOFTWARE', 'OTHER']),
  description: z.string().min(2, "Deskripsi wajib diisi"),
  amount: z.coerce.number().min(1, "Jumlah wajib diisi"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  clientId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

