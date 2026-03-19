import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  notifications,
  type Notification,
  type InsertNotification,
} from "@shared/project-schema";

export class NotificationRepository {
  async getByUserId(userId: string, limit?: number): Promise<Notification[]> {
    const query = db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt));

    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.isRead, false)
        )
      );
    return Number(result[0]?.count || 0);
  }

  async create(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return created;
  }

  async markAsRead(id: string): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.recipientId, userId));
  }

  async delete(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async createForMultipleUsers(
    userIds: string[],
    notificationData: Omit<InsertNotification, "recipientId">
  ): Promise<Notification[]> {
    const notificationsToCreate = userIds.map((userId) => ({
      ...notificationData,
      recipientId: userId,
    }));

    const created = await db
      .insert(notifications)
      .values(notificationsToCreate)
      .returning();
    return created;
  }
}

export const notificationRepository = new NotificationRepository();
