import { projectFileRepository } from "../repositories/projectFile.repository";
import { registerInMediaLibrary } from "../utils/registerInMediaLibrary";
import { activityRepository } from "../repositories/activity.repository";

export class OrderFileService {
  async getByOrderId(orderId: string) {
    return projectFileRepository.getByOrderId(orderId);
  }

  async upload(orderId: string, userId: string, data: {
    files: Express.Multer.File[];
    fileType: string;
    notes?: string;
    autoGenerateApproval?: string;
    productIds: (string | undefined)[];
  }) {
    const order = await projectFileRepository.getOrder(orderId);
    if (!order) return { error: "order_not_found" };

    const uploadedFiles = await Promise.all(
      data.files.map(async (file, index) => {
        const cloudinaryUrl = (file as any).path;
        const publicId = (file as any).filename || (file as any).public_id;

        const orderItemId = data.fileType === "customer_proof" && data.productIds[index]
          ? data.productIds[index]
          : null;

        const fileRecord = await projectFileRepository.create({
          orderId,
          orderItemId: orderItemId || null,
          fileName: publicId,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          filePath: cloudinaryUrl,
          fileType: data.fileType,
          tags: [data.fileType],
          notes: data.notes || null,
          uploadedBy: userId,
        });

        // Dual-write to media library
        try {
          await registerInMediaLibrary({
            cloudinaryUrl,
            cloudinaryPublicId: publicId,
            fileName: publicId,
            originalName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            category: data.fileType,
            orderId,
            orderItemId: orderItemId || undefined,
            sourceTable: "order_files",
            sourceId: fileRecord.id,
            uploadedBy: userId,
            tags: [data.fileType],
          });
        } catch (mlError) {
          console.error("Failed to register in media library (non-blocking):", mlError);
        }

        return { fileRecord, orderItemId };
      })
    );

    // Auto-generate approval links for customer proofs
    const approvalLinks = [];
    if (data.fileType === "customer_proof" && data.autoGenerateApproval === "true") {
      const crypto = await import("crypto");

      for (const { fileRecord, orderItemId } of uploadedFiles) {
        if (!orderItemId) continue;

        const orderItem = await projectFileRepository.getOrderItemWithProduct(orderItemId);

        const newArtworkFile = await projectFileRepository.createArtworkFile({
          orderId,
          fileName: fileRecord.fileName,
          filePath: fileRecord.filePath,
          originalName: fileRecord.originalName,
          fileSize: fileRecord.fileSize || 0,
          mimeType: fileRecord.mimeType || "application/octet-stream",
          uploadedBy: userId,
        });

        const approvalToken = crypto.randomBytes(32).toString("hex");

        await projectFileRepository.createArtworkApproval({
          orderId,
          orderItemId,
          artworkFileId: newArtworkFile.id,
          approvalToken,
          status: "pending",
          sentAt: new Date(),
        });

        approvalLinks.push({
          token: approvalToken,
          productName: orderItem?.productName || "Product",
          fileId: fileRecord.id,
        });
      }
    }

    return {
      files: uploadedFiles.map(f => f.fileRecord),
      approvalLinks: approvalLinks.length > 0 ? approvalLinks : undefined,
    };
  }

  async deleteFile(orderId: string, fileId: string) {
    const file = await projectFileRepository.getById(fileId, orderId);
    if (!file) return { error: "not_found" };

    // Delete from Cloudinary
    if (file.fileName && file.fileName.includes("/")) {
      try {
        const { deleteFromCloudinary } = await import("../config/cloudinary");
        await deleteFromCloudinary(file.fileName);
      } catch (err) {
        console.error("Failed to delete from Cloudinary:", err);
      }
    } else {
      // Legacy: local storage
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "uploads", file.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("Failed to delete file from local storage:", err);
      }
    }

    await projectFileRepository.delete(fileId);
    return { success: true };
  }

  async sendProof(orderId: string, userId: string, req: any, data: {
    fileId?: string;
    orderItemId?: string;
    clientEmail: string;
    clientName?: string;
    message?: string;
  }) {
    const order = await projectFileRepository.getOrder(orderId);
    if (!order) return { error: "order_not_found" };

    let artworkFileId = null;
    if (data.fileId) {
      const orderFile = await projectFileRepository.getById(data.fileId);
      if (!orderFile) return { error: "file_not_found" };

      const newArtworkFile = await projectFileRepository.createArtworkFile({
        orderId,
        fileName: orderFile.fileName,
        filePath: orderFile.filePath,
        originalName: orderFile.originalName,
        fileSize: orderFile.fileSize || 0,
        mimeType: orderFile.mimeType || "application/octet-stream",
        uploadedBy: userId,
      });
      artworkFileId = newArtworkFile.id;
    }

    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");

    const approval = await projectFileRepository.createArtworkApproval({
      orderId,
      orderItemId: data.orderItemId || null,
      artworkFileId: artworkFileId!,
      approvalToken: token,
      status: "pending",
      clientEmail: data.clientEmail,
      clientName: data.clientName || null,
      sentAt: new Date(),
    });

    const approvalUrl = `${req.protocol}://${req.get("host")}/approval/${token}`;

    // Send email
    let emailSent = false;
    if (data.clientEmail) {
      try {
        const { emailService } = await import("./email.service");
        const clientDisplayName = data.clientName || data.clientEmail;
        const customMessage = data.message
          ? `<p style="color: #374151; line-height: 1.6; font-size: 14px;">${data.message.replace(/\n/g, "<br>")}</p>`
          : "";

        await emailService.sendEmail({
          to: data.clientEmail,
          subject: `Artwork Proof for Review - Order #${order.orderNumber}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background-color: #2563eb; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Artwork Proof</h1>
                  <p style="color: #dbeafe; margin: 5px 0 0 0; font-size: 14px;">Order #${order.orderNumber}</p>
                </div>
                <div style="padding: 30px;">
                  <p style="color: #374151; line-height: 1.6; font-size: 14px;">Hi ${clientDisplayName},</p>
                  <p style="color: #374151; line-height: 1.6; font-size: 14px;">Your artwork proof is ready for review. Please click the button below to view and approve the proof.</p>
                  ${customMessage}
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${approvalUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Review &amp; Approve Artwork</a>
                  </div>
                  <p style="color: #6b7280; font-size: 12px; text-align: center;">Or copy this link: <a href="${approvalUrl}" style="color: #2563eb;">${approvalUrl}</a></p>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        emailSent = true;
      } catch (emailError) {
        console.error("Failed to send proof email to client:", emailError);
      }
    }

    // Update order status
    if (emailSent && order.status !== "pending_approval" && order.status !== "approved") {
      await projectFileRepository.updateOrderStatus(orderId, "pending_approval");
    }

    // Auto-advance production stage
    try {
      const stagesCompleted = Array.isArray(order.stagesCompleted)
        ? order.stagesCompleted
        : JSON.parse(JSON.stringify(order.stagesCompleted || '["created"]'));
      const stagesArr = Array.isArray(stagesCompleted) ? stagesCompleted : JSON.parse(stagesCompleted);

      if (!stagesArr.includes("confirmed")) {
        const updatedCompleted = Array.from(new Set([...stagesArr, "confirmed"]));
        await projectFileRepository.updateOrderStage(orderId, "confirmed", updatedCompleted);

        await activityRepository.createActivity({
          userId,
          entityType: "order",
          entityId: orderId,
          action: "stage_updated",
          description: `Production stage auto-advanced to "Proof Received" when proof was sent to client`,
        });
      }
    } catch (stageError) {
      console.error("Failed to auto-advance production stage:", stageError);
    }

    return {
      success: true,
      message: "Approval request created",
      approval,
      approvalUrl,
      emailSent,
    };
  }
}

export const orderFileService = new OrderFileService();
