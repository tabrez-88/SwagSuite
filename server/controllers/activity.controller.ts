import type { Request, Response } from "express";
import { activityService } from "../services/activity.service";
import { getUserId } from "../utils/getUserId";
import { cloudinary } from "../config/cloudinary";

export class ActivityController {
  static async list(req: Request, res: Response) {
    const activities = await activityService.getByOrderId(req.params.orderId);
    res.json(activities);
  }

  static async create(req: Request, res: Response) {
    const { orderId } = req.params;
    const userId = req.user?.claims?.sub || "system-user";
    const { activityType, content, mentionedUsers, attachments } = req.body;

    const activity = await activityService.create(orderId, userId, {
      activityType,
      content,
      mentionedUsers,
      attachments,
    });

    res.json(activity);
  }

  static async uploadFile(req: Request, res: Response) {
    const { orderId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.user?.claims?.sub || "system-user";
    const activity = await activityService.uploadFile(orderId, userId, file);
    res.json(activity);
  }

  static async downloadFile(req: Request, res: Response) {
    const { orderId, activityId } = req.params;
    const result = await activityService.getFileDownloadInfo(orderId, activityId);

    if (!result) {
      return res.status(404).json({ error: "File not found" });
    }

    const { metadata } = result;

    if (metadata.cloudinaryUrl) {
      const downloadUrl = cloudinary.url(metadata.cloudinaryPublicId || '', {
        flags: 'attachment',
        resource_type: 'auto',
      });
      return res.redirect(downloadUrl);
    }

    // Legacy: handle old storage files
    const { storageService } = await import("../services/storage.service");
    const fileBuffer = await storageService.downloadFile(metadata.storagePath!);

    if (!fileBuffer) {
      return res.status(404).json({ error: "File not found in storage" });
    }

    res.setHeader('Content-Type', metadata.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.fileName}"`);
    res.send(fileBuffer);
  }
}
