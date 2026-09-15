import { Telegraf } from 'telegraf';
import prisma from './prisma';

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

export async function sendMessage(chatId: string, text: string, options?: any) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    await bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
  } catch (error) {
    console.error(`Failed to send Telegram message to ${chatId}:`, error);
  }
}

export function formatNotification(notification: any) {
  const icon = notification.priority === 'URGENT' ? '🚨' : notification.priority === 'IMPORTANT' ? '⚠️' : '🔔';
  let message = `${icon} *${notification.title}*\n\n${notification.message}`;
  
  const options: any = {};
  if (notification.link) {
    const url = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}${notification.link}` : `http://localhost:3000${notification.link}`;
    options.reply_markup = {
      inline_keyboard: [[{ text: 'Buka Aplikasi ➡️', url }]]
    };
  }
  
  return { message, options };
}

export async function sendToUser(userId: string, notification: any) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationPreferences: true }
  });

  if (!user?.telegramChatId || !user.telegramConnected) return false;

  const pref = user.notificationPreferences.find(p => p.type === notification.type);
  if (pref && !pref.telegramEnabled) return false;

  const hour = new Date().getHours(); // Assuming server timezone matches user or roughly IDT
  const isQuietHour = hour >= 22 || hour < 7;

  if (isQuietHour) {
    // Return true meaning it should be queued
    return true; 
  }

  const { message, options } = formatNotification(notification);
  await sendMessage(user.telegramChatId, message, options);
  return false; // not queued
}

export async function sendToGroup(workspaceId: string, role: string, notification: any) {
  const groups = await prisma.telegramGroup.findMany({
    where: { workspaceId, role: role as any }
  });

  const { message, options } = formatNotification(notification);
  for (const group of groups) {
    await sendMessage(group.groupId, message, options);
  }
}
