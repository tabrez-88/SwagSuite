import type { Request, Response } from "express";
import { mediaLibraryService } from "../services/mediaLibrary.service";
import { getUserId } from "../utils/getUserId";

export class MediaLibraryController {
  static async list(req: Request, res: Response) {
    const { folder, category, companyId, orderId, search, mimeType, limit, offset } = req.query;
    const result = await mediaLibraryService.list({
      folder: folder as string | undefined,
      category: category as string | undefined,
      companyId: companyId as string | undefined,
      orderId: orderId as string | undefined,
      search: search as string | undefined,
      mimeType: mimeType as string | undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });
    res.json(result);
  }

  static async getById(req: Request, res: Response) {
    const item = await mediaLibraryService.getById(req.params.id);
    if (!item) return res.status(404).json({ error: "File not found" });
    res.json(item);
  }

  static async upload(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const userId = getUserId(req);
    const { folder, category, orderId, companyId } = req.body;

    const items = await mediaLibraryService.upload(files, userId, {
      folder: folder || undefined,
      category: category || undefined,
      orderId: orderId || undefined,
      companyId: companyId || undefined,
    });

    res.json(items);
  }

  static async update(req: Request, res: Response) {
    const { tags, category, description, folder, fileName } = req.body;
    const updated = await mediaLibraryService.update(req.params.id, { tags, category, description, folder, fileName });
    res.json(updated);
  }

  static async delete(req: Request, res: Response) {
    const result = await mediaLibraryService.delete(req.params.id);
    if (!result) return res.status(404).json({ error: "File not found" });
    res.json(result);
  }

  static async linkToOrder(req: Request, res: Response) {
    const { projectId } = req.params;
    const { mediaLibraryIds, fileType = "other_document", notes } = req.body;

    if (!mediaLibraryIds || !Array.isArray(mediaLibraryIds) || mediaLibraryIds.length === 0) {
      return res.status(400).json({ error: "No file IDs provided" });
    }

    const files = await mediaLibraryService.linkToOrder(projectId, mediaLibraryIds, fileType, notes);
    res.json({ files });
  }
}
