import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendMessage } from '@/lib/telegram';

declare global {
  var telegramCodes: Map<string, string>;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { code } = body;

    if (!code || !global.telegramCodes || !global.telegramCodes.has(code)) {
      return NextResponse.json({ error: 'Kode tidak valid atau kadaluarsa' }, { status: 400 });
    }

    const chatId = global.telegramCodes.get(code)!;
    
    // Check if chat ID is already used
    const existing = await prisma.user.findFirst({ where: { telegramChatId: chatId } });
    if (existing) {
      return NextResponse.json({ error: 'Akun Telegram ini sudah terhubung ke pengguna lain' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        telegramChatId: chatId,
        telegramConnected: true,
        telegramConnectedAt: new Date()
      }
    });

    global.telegramCodes.delete(code);

    await sendMessage(chatId, '✅ Berhasil! Akun Telegram Anda telah terhubung dengan ContentPlanner.');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
