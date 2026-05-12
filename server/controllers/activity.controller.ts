import type { Request, Response } from "express";
import { activityService } from "../services/activity.service";
import { getUserId } from "../utils/getUserId";
import { cloudinary } from "../config/cloudinary";

export class ActivityController {
  static async list(req: Request, res: Response) {
    const limitParam = req.query.limit as string | undefined;
    const offsetParam = req.query.offset as string | undefined;

    // If limit is provided, return paginated response
    if (limitParam) {
      const limit = Math.min(Math.max(parseInt(limitParam, 10) || 5, 1), 50);
      const offset = Math.max(parseInt(offsetParam || "0", 10) || 0, 0);

      const result = await activityService.getByOrderId(req.params.projectId, { limit, offset });
      const { data, total } = result as { data: any[]; total: number };

      return res.json({
        data,
        total,
        hasMore: offset + data.length < total,
      });
    }

    // No pagination params — return all (backward compat)
    const activities = await activityService.getByOrderId(req.params.projectId);
    res.json(activities);
  }

  static async create(req: Request, res: Response) {
    const { projectId } = req.params;
    const userId = req.user?.claims?.sub || "system-user";
    const { activityType, content, mentionedUsers, attachments } = req.body;

    const activity = await activityService.create(projectId, userId, {
      activityType,
      content,
      mentionedUsers,
      attachments,
    });

    res.json(activity);
  }

  static async uploadFile(req: Request, res: Response) {
    const { projectId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.user?.claims?.sub || "system-user";
    const activity = await activityService.uploadFile(projectId, userId, file);
    res.json(activity);
  }

  static async downloadFile(req: Request, res: Response) {
    const { projectId, activityId } = req.params;
    const result = await activityService.getFileDownloadInfo(projectId, activityId);

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
