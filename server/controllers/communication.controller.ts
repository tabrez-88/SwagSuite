import type { Request, Response } from "express";
import { communicationService } from "../services/communication.service";
import { previewEmailBody } from "../services/emailPipeline.service";
import { getUserId } from "../utils/getUserId";

export class CommunicationController {
  static async list(req: Request, res: Response) {
    const { projectId } = req.params;
    const type = req.query.type as string | undefined;
    const result = await communicationService.getByOrderId(projectId, type);
    res.json(result);
  }

  static async create(req: Request, res: Response) {
    const { projectId } = req.params;
    const userId = req.user?.claims?.sub || "system-user";
    const {
      communicationType, direction, fromEmail, fromName,
      recipientEmail, recipientName, subject, body, metadata,
      attachmentIds, autoAttachArtworkForVendor, autoAttachDocumentFile,
      additionalAttachments, cc, bcc, mergeContext,
    } = req.body;

    const result = await communicationService.create(projectId, userId, {
      communicationType, direction, fromEmail, fromName,
      recipientEmail, recipientName, subject, body, metadata,
      cc, bcc, attachmentIds, autoAttachArtworkForVendor, autoAttachDocumentFile,
      additionalAttachments, mergeContext,
    }, req);

    // If email failed, return 207 (partial success)
    if (result && (result as any).emailStatus === 'failed') {
      return res.status(207).json(result);
    }

    res.json(result);
  }

  static async sendEmail(req: Request, res: Response) {
    const {
      fromEmail, fromName, recipientEmail, recipientName, subject, body, cc, bcc, companyName,
      additionalAttachments,
    } = req.body;

    if (!recipientEmail || !subject || !body) {
      return res.status(400).json({ error: "recipientEmail, subject, and body are required" });
    }

    const userId = getUserId(req);
    await communicationService.sendGeneralEmail(userId, {
      fromEmail, fromName, recipientEmail, recipientName, subject, body, cc, bcc, companyName,
      additionalAttachments,
    });

    res.json({ success: true, message: "Email sent successfully" });
  }

  static async previewEmail(req: Request, res: Response) {
    const { html, mergeContext } = req.body;

    if (!html || !mergeContext) {
      return res.status(400).json({ error: "html and mergeContext are required" });
    }

    const resolved = await previewEmailBody(html, mergeContext, req);
    res.json({ html: resolved });
  }
}
