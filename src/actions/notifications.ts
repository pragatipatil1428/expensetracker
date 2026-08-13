"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { syncNotifications } from "@/lib/notifications";
import { toNotificationDTO } from "@/lib/serialize";
import type { ActionResult, NotificationDTO } from "@/lib/types";

export async function getNotificationsAction(): Promise<
  ActionResult<{ items: NotificationDTO[]; unread: number }>
> {
  const userId = await requireUserId();
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return {
    success: true,
    data: { items: items.map(toNotificationDTO), unread },
  };
}

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
  return { success: true, data: undefined };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return { success: true, data: undefined };
}

export async function deleteNotificationAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.notification.deleteMany({ where: { id, userId } });
  return { success: true, data: undefined };
}

/** Force a notification sync (used after settings changes). */
export async function refreshNotificationsAction(): Promise<ActionResult> {
  const userId = await requireUserId();
  await syncNotifications(userId);
  return { success: true, data: undefined };
}
