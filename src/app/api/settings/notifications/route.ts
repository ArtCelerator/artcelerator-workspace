export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { notificationPreferences: true }
    });

    return NextResponse.json({
      telegramConnected: user?.telegramConnected,
      telegramChatId: user?.telegramChatId,
      preferences: user?.notificationPreferences || []
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, inAppEnabled, telegramEnabled } = body;

    const pref = await prisma.notificationPreference.upsert({
      where: { userId_type: { userId: session.user.id, type: type as NotificationType } },
      create: { userId: session.user.id, type, inAppEnabled, telegramEnabled },
      update: { inAppEnabled, telegramEnabled }
    });

    return NextResponse.json(pref);
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) { // for disconnect
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { telegramConnected: false, telegramChatId: null, telegramConnectedAt: null }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
