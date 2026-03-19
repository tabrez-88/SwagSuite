import { notificationRepository } from "../repositories/notification.repository";
import type { InsertNotification, Notification } from "@shared/project-schema";

export class NotificationService {
  async getByUserId(userId: string, limit?: number): Promise<Notification[]> {
    return notificationRepository.getByUserId(userId, limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  }

  async markAsRead(id: string): Promise<Notification | undefined> {
    return notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string): Promise<void> {
    return notificationRepository.markAllAsRead(userId);
  }

  async delete(id: string): Promise<void> {
    return notificationRepository.delete(id);
  }

  async createForMultipleUsers(
    userIds: string[],
    data: Omit<InsertNotification, "recipientId">
  ): Promise<Notification[]> {
    return notificationRepository.createForMultipleUsers(userIds, data);
  }
}

export const notificationService = new NotificationService();
