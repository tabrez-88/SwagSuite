import type { Request, Response } from "express";
import { orderFileService } from "../services/orderFile.service";
import { getUserId } from "../utils/getUserId";

export class ProjectFileController {
  static async list(req: Request, res: Response) {
    const { projectId } = req.params;
    const files = await orderFileService.getByOrderId(projectId);
    res.json(files);
  }

  static async upload(req: Request, res: Response) {
    const { projectId } = req.params;
    const { fileType = "customer_proof", notes, autoGenerateApproval } = req.body;
    const files = req.files as Express.Multer.File[];
    const userId = getUserId(req);

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Parse productIds array from request body
    const productIds: (string | undefined)[] = [];
    if (fileType === "customer_proof") {
      if (Array.isArray(req.body.productIds)) {
        productIds.push(...req.body.productIds);
      } else if (req.body.productIds) {
        productIds.push(req.body.productIds);
      } else {
        Object.keys(req.body)
          .filter(key => key.startsWith("productIds["))
          .sort((a, b) => {
            const indexA = parseInt(a.match(/\d+/)?.[0] || "0");
            const indexB = parseInt(b.match(/\d+/)?.[0] || "0");
            return indexA - indexB;
          })
          .forEach(key => {
            productIds.push(req.body[key]);
          });
      }
    }

    const result = await orderFileService.upload(projectId, userId, {
      files,
      fileType,
      notes,
      autoGenerateApproval,
      productIds,
    });

    if ("error" in result) {
      if (result.error === "order_not_found") {
        return res.status(404).json({ message: "Order not found" });
      }
    }

    res.json(result);
  }

  static async delete(req: Request, res: Response) {
    const { projectId, fileId } = req.params;
    const result = await orderFileService.deleteFile(projectId, fileId);

    if ("error" in result) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json(result);
  }

  static async sendProof(req: Request, res: Response) {
    const { projectId } = req.params;
    const { fileId, orderItemId, clientEmail, clientName, message } = req.body;
    const userId = getUserId(req);

    if (!clientEmail) {
      return res.status(400).json({ message: "Client email is required" });
    }

    const result = await orderFileService.sendProof(projectId, userId, req, {
      fileId,
      orderItemId,
      clientEmail,
      clientName,
      message,
    });

    if ("error" in result) {
      if (result.error === "order_not_found") return res.status(404).json({ message: "Order not found" });
      if (result.error === "file_not_found") return res.status(404).json({ message: "File not found" });
    }

    res.json(result);
  }
}
