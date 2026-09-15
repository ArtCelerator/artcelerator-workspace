import { NextResponse } from 'next/server';
import { bot, sendMessage } from '@/lib/telegram';
import prisma from '@/lib/prisma';

// Simple in-memory storage for MVP (Note: clears on server restart)
declare global {
  var telegramCodes: Map<string, string>;
}
if (!global.telegramCodes) global.telegramCodes = new Map();

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    // Optional: verify secret from telegram URL

    const body = await req.json();

    if (body.message && body.message.text) {
      const chatId = body.message.chat.id.toString();
      const text = body.message.text as string;

      if (text.startsWith('/start')) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        global.telegramCodes.set(code, chatId);
        
        await sendMessage(chatId, `Selamat datang di ContentPlanner Bot! 🤖\n\nKode verifikasi Anda adalah: *${code}*\n\nSilakan masukkan kode ini di halaman Pengaturan > Notifikasi pada aplikasi.`);
      } else if (text.startsWith('/help')) {
        await sendMessage(chatId, 'Perintah tersedia:\n/start - Hubungkan akun\n/status - Lihat statistik\n/help - Bantuan');
      } else if (text.startsWith('/status')) {
        // Find user by chat id
        const user = await prisma.user.findFirst({ where: { telegramChatId: chatId } });
        if (!user) {
          await sendMessage(chatId, 'Akun belum terhubung. Ketik /start untuk menghubungkan.');
        } else {
          // Send quick stats
          const activeContents = await prisma.content.count({
            where: { assignedToId: user.id, status: { notIn: ['PUBLISHED', 'ARCHIVED'] } }
          });
          await sendMessage(chatId, `Halo *${user.name}*!\n\nAnda memiliki *${activeContents}* tugas konten yang aktif hari ini. Semangat! 💪`);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
