export type ContentStatus = 'IDEA' | 'DRAFTING' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
export type ContentType = 'BLOG' | 'VIDEO' | 'INFOGRAPHIC' | 'SOCIAL_POST' | 'STORY' | 'REEL' | 'PODCAST' | 'NEWSLETTER' | 'CAROUSEL' | 'THREAD';
export type Platform = 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'TWITTER' | 'LINKEDIN' | 'FACEBOOK' | 'THREADS' | 'PINTEREST' | 'BLOG' | 'EMAIL';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'EDITOR';

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: 'Manajemen',
  ADMIN: 'Creative Director',
  EDITOR: 'Team'
};

export const STATUS_LABELS: Record<ContentStatus, string> = {
  IDEA: 'Ide',
  DRAFTING: 'Drafting',
  REVIEW: 'Menunggu Review',
  SCHEDULED: 'Dijadwalkan',
  PUBLISHED: 'Published',
  ARCHIVED: 'Arsip'
};

export const STATUS_COLORS: Record<ContentStatus, string> = {
  IDEA: 'bg-gray-100 text-gray-800',
  DRAFTING: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-amber-100 text-amber-800',
  SCHEDULED: 'bg-purple-100 text-purple-800',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  ARCHIVED: 'bg-zinc-100 text-zinc-800'
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Rendah',
  MEDIUM: 'Sedang',
  HIGH: 'Tinggi',
  URGENT: 'Mendesak'
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'bg-slate-100 text-slate-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
};

export const PLATFORM_INFO: Record<Platform, { label: string; icon: string }> = {
  INSTAGRAM: { label: 'Instagram', icon: '📸' },
  TIKTOK: { label: 'TikTok', icon: '🎵' },
  YOUTUBE: { label: 'YouTube', icon: '▶️' },
  TWITTER: { label: 'Twitter', icon: '🐦' },
  LINKEDIN: { label: 'LinkedIn', icon: '💼' },
  FACEBOOK: { label: 'Facebook', icon: '📘' },
  THREADS: { label: 'Threads', icon: '🧵' },
  PINTEREST: { label: 'Pinterest', icon: '📌' },
  BLOG: { label: 'Blog', icon: '📝' },
  EMAIL: { label: 'Email', icon: '✉️' }
};

export const CONTENT_TYPE_INFO: Record<ContentType, { label: string; icon: string }> = {
  BLOG: { label: 'Artikel Blog', icon: '📝' },
  VIDEO: { label: 'Video Panjang', icon: '🎬' },
  INFOGRAPHIC: { label: 'Infografis', icon: '📊' },
  SOCIAL_POST: { label: 'Postingan Sosial', icon: '📱' },
  STORY: { label: 'Story', icon: '⏱️' },
  REEL: { label: 'Reel / Short', icon: '📱' },
  PODCAST: { label: 'Podcast', icon: '🎙️' },
  NEWSLETTER: { label: 'Newsletter', icon: '📰' },
  CAROUSEL: { label: 'Carousel', icon: '🎠' },
  THREAD: { label: 'Thread', icon: '🧵' }
};
