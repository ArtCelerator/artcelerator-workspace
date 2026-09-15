import prisma from './prisma';
import { sendToUser, sendToGroup } from './telegram';
import { NotificationType, NotificationPriority } from '@prisma/client';

type CreateNotificationProps = {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  link?: string;
};

export async function createNotification(data: CreateNotificationProps) {
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId_type: { userId: data.userId, type: data.type } }
  });

  const inAppEnabled = pref ? pref.inAppEnabled : true;
  
  let queued = false;
  if (pref ? pref.telegramEnabled : true) {
    queued = await sendToUser(data.userId, data);
  }

  if (inAppEnabled) {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        priority: data.priority || 'NORMAL',
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: queued ? { queued: true } : undefined
      }
    });
  }
}

export async function notifyRole({ workspaceId, role, type, priority, title, message, link }: any) {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId, role: { in: Array.isArray(role) ? role : [role] } }
  });

  for (const member of members) {
    await createNotification({ userId: member.userId, type, priority, title, message, link });
  }

  // Group notifications could go here
  if (Array.isArray(role)) {
    for (const r of role) await sendToGroup(workspaceId, r, { type, priority, title, message, link });
  } else {
    await sendToGroup(workspaceId, role, { type, priority, title, message, link });
  }
}

export async function notifyAssigned({ contentId, type, priority, title, message, link }: any) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (content?.assignedToId) {
    await createNotification({ userId: content.assignedToId, type, priority, title, message, link: link || `/contents/${content.id}` });
  }
}
