import type { Request, Response } from "express";
import { documentService } from "../services/document.service";
import { getUserId } from "../utils/getUserId";

export class DocumentController {
  static async list(req: Request, res: Response) {
    const { projectId } = req.params;
    const documents = await documentService.getByOrderId(projectId);
    res.json(documents);
  }

  static async create(req: Request, res: Response) {
    const { projectId } = req.params;
    const { documentType, documentNumber, vendorId, vendorName, status } = req.body;
    const userId = getUserId(req);

    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    let metadata = {};
    try {
      metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    } catch {
      metadata = {};
    }

    const document = await documentService.create(projectId, userId, {
      documentType,
      documentNumber,
      vendorId,
      vendorName,
      status,
      metadata,
      file: req.file,
    });

    res.json(document);
  }

  static async preview(req: Request, res: Response) {
    const { documentId } = req.params;
    const result = await documentService.preview(documentId);

    if (!result) {
      return res.status(404).json({ message: "Document not found" });
    }
    if ("error" in result) {
      return res.status(404).json({ message: "Document file URL not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${result.fileName}"`);
    res.setHeader("Content-Length", result.byteLength.toString());
    res.send(result.buffer);
  }

  static async update(req: Request, res: Response) {
    const { documentId } = req.params;
    const { status, sentAt, metadata } = req.body;

    const updated = await documentService.update(documentId, { status, sentAt, metadata });
    res.json(updated);
  }

  static async delete(req: Request, res: Response) {
    const { documentId } = req.params;
    await documentService.deleteDocument(documentId);
    res.json({ success: true, message: "Document deleted" });
  }

  static async nextPoSequence(req: Request, res: Response) {
    const { documentRepository } = await import("../repositories/document.repository");
    const orderId = req.query.orderId as string | undefined;
    const next = await documentRepository.getNextPoSequence(orderId);
    res.json({ next });
  }
}
