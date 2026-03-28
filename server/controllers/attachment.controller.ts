import type { Request, Response } from "express";
import { attachmentRepository } from "../repositories/attachment.repository";

export class AttachmentController {
  static async list(req: Request, res: Response) {
    const { projectId } = req.params;
    const category = req.query.category as string | undefined;
    const attachments = await attachmentRepository.getByOrderId(projectId, category);
    res.json(attachments);
  }

  static async upload(req: Request, res: Response) {
    const { projectId } = req.params;
    const files = req.files as Express.Multer.File[];
    const { category = 'attachment' } = req.body;
    const userId = req.user?.claims?.sub;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedAttachments = [];
    for (const file of files) {
      const cloudinaryUrl = (file as any).path;
      if (!cloudinaryUrl) continue;

      const attachment = await attachmentRepository.create({
        filename: file.filename || file.originalname,
        originalFilename: file.originalname,
        storagePath: cloudinaryUrl,
        mimeType: file.mimetype || null,
        fileSize: file.size || null,
        category: category || 'attachment',
        uploadedBy: userId || null,
        orderId: projectId,
      });

      uploadedAttachments.push(attachment);
    }

    res.json({ success: true, attachments: uploadedAttachments });
  }

  static async download(req: Request, res: Response) {
    const { attachmentId } = req.params;
    const attachment = await attachmentRepository.getById(attachmentId);

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const { storageService } = await import("../services/storage.service");
    const fileBuffer = await storageService.downloadFile(attachment.storagePath);

    if (!fileBuffer) {
      return res.status(500).json({ message: 'Failed to download file' });
    }

    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalFilename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.send(fileBuffer);
  }

  static async delete(req: Request, res: Response) {
    const { attachmentId } = req.params;
    const attachment = await attachmentRepository.getById(attachmentId);

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const { storageService } = await import("../services/storage.service");
    await storageService.deleteFile(attachment.storagePath);
    await attachmentRepository.delete(attachmentId);

    res.json({ success: true });
  }
}
