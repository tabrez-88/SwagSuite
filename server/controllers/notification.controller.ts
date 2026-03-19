import type { Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import { getUserId } from "../utils/getUserId";

export class NotificationController {
  static async list(req: Request, res: Response) {
    const userId = getUserId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const notifications = await notificationService.getByUserId(userId, limit);
    res.json(notifications);
  }

  static async getUnreadCount(req: Request, res: Response) {
    const userId = getUserId(req);
    const count = await notificationService.getUnreadCount(userId);
    res.json({ count });
  }

  static async markAsRead(req: Request, res: Response) {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json(notification);
  }

  static async markAllAsRead(req: Request, res: Response) {
    const userId = getUserId(req);
    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  }

  static async delete(req: Request, res: Response) {
    await notificationService.delete(req.params.id);
    res.status(204).send();
  }
}
