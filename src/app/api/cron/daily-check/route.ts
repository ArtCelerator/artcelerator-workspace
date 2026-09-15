export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyAssigned, notifyRole } from '@/lib/notification-service';
import { sendToUser } from '@/lib/telegram';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    if (token !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Overdue Check (Contents)
    const overdueContents = await prisma.content.findMany({
      where: { publishDate: { lt: today }, status: { notIn: ['PUBLISHED', 'ARCHIVED'] }, assignedToId: { not: null } }
    });
    for (const c of overdueContents) {
      await notifyAssigned({ contentId: c.id, type: 'CONTENT_OVERDUE', priority: 'URGENT', title: 'Tenggat Terlewat', message: `Konten "${c.title}" telah melewati tenggat waktu.` });
    }

    // 2. H-1 Reminder
    const reminderContents = await prisma.content.findMany({
      where: { publishDate: { gte: tomorrow, lt: new Date(tomorrow.getTime() + 86400000) }, status: 'SCHEDULED' }
    });
    for (const c of reminderContents) {
      await notifyAssigned({ contentId: c.id, type: 'CONTENT_REMINDER', priority: 'IMPORTANT', title: 'Pengingat H-1', message: `Konten "${c.title}" dijadwalkan tayang besok.` });
      await notifyRole({ workspaceId: c.workspaceId, role: 'CREATIVE_DIRECTOR', type: 'CONTENT_REMINDER', title: 'Pengingat H-1', message: `Konten "${c.title}" dijadwalkan tayang besok.`, link: `/contents/${c.id}` });
    }

    // 3 & 4. Invoice Due & Overdue
    const invoices = await prisma.invoice.findMany({ where: { status: 'SENT' } });
    for (const inv of invoices) {
      if (!inv.dueDate) continue;
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0,0,0,0);
      if (dueDate.getTime() === today.getTime()) {
        await notifyRole({ workspaceId: inv.workspaceId, role: ['ADMIN', 'CREATIVE_DIRECTOR'], type: 'INVOICE_DUE', priority: 'URGENT', title: 'Invoice Jatuh Tempo', message: `Invoice ${inv.invoiceNo} jatuh tempo hari ini.`, link: '/finance' });
      } else if (dueDate.getTime() < today.getTime()) {
        await notifyRole({ workspaceId: inv.workspaceId, role: ['ADMIN', 'CREATIVE_DIRECTOR'], type: 'INVOICE_OVERDUE', priority: 'URGENT', title: 'Invoice Menunggak', message: `Invoice ${inv.invoiceNo} telah menunggak.`, link: '/finance' });
      }
    }

    // 5. Contract Expiring
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);
    const clients = await prisma.client.findMany({
      where: { contractEnd: { gte: today, lte: in30Days }, status: 'ACTIVE' }
    });
    for (const client of clients) {
      await notifyRole({ workspaceId: client.workspaceId, role: ['ADMIN', 'CREATIVE_DIRECTOR'], type: 'CONTRACT_EXPIRING', title: 'Kontrak Akan Habis', message: `Kontrak klien ${client.name} akan habis pada ${client.contractEnd?.toLocaleDateString('id-ID')}.`, link: `/clients/${client.id}` });
    }

    // 6. Send Queued Telegrams
    const queuedNotifs = await prisma.notification.findMany({
      where: { metadata: { path: ['queued'], equals: true }, isRead: false }
    });
    for (const n of queuedNotifs) {
      await sendToUser(n.userId, n);
      const newMeta = { ...(n.metadata as any || {}), queued: false };
      await prisma.notification.update({ where: { id: n.id }, data: { metadata: newMeta } });
    }

    // 7. Sync Sheets
    // Calling internal GET since fetch inside api route to own host might fail in serverless without absolute URL
    // Best practice is to extract the logic, but for now we try to fetch it if NEXT_PUBLIC_APP_URL is set
    if (process.env.NEXT_PUBLIC_APP_URL) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/sync-sheets?token=${process.env.CRON_SECRET}`).catch(e => console.error(e));
    }

    return NextResponse.json({ success: true, processedOverdue: overdueContents.length, processedInvoices: invoices.length, queuedSent: queuedNotifs.length });
  } catch (error: any) {
    console.error('CRON Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
