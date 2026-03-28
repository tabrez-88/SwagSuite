import { communicationRepository } from "../repositories/communication.repository";
import { companyRepository } from "../repositories/company.repository";
import { supplierRepository } from "../repositories/supplier.repository";
import { orderRepository } from "../repositories/order.repository";
import { db } from "../db";

export class CommunicationService {
  async getByOrderId(orderId: string, type?: string) {
    return communicationRepository.getByOrderId(orderId, type);
  }

  async create(orderId: string, userId: string, data: {
    communicationType: string;
    direction: string;
    fromEmail?: string;
    fromName?: string;
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    body: string;
    metadata?: any;
    cc?: string;
    bcc?: string;
    attachmentIds?: string[];
    autoAttachArtworkForVendor?: string;
    autoAttachDocumentFile?: { fileUrl: string; fileName?: string };
  }) {
    // Create communication record
    const communication = await communicationRepository.create({
      orderId,
      userId,
      communicationType: data.communicationType,
      direction: data.direction,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      subject: data.subject,
      body: data.body,
      metadata: data.metadata || {},
    });

    // Link attachments
    if (data.attachmentIds && data.attachmentIds.length > 0) {
      await communicationRepository.linkAttachments(communication.id, data.attachmentIds);
    }

    // Build email attachments
    let emailAttachments: Array<{ storagePath: string; originalFilename: string; mimeType: string }> = [];
    if (data.attachmentIds && data.attachmentIds.length > 0) {
      const records = await communicationRepository.getAttachmentsByIds(data.attachmentIds);
      emailAttachments = records.map(att => ({
        storagePath: att.storagePath,
        originalFilename: att.originalFilename,
        mimeType: att.mimeType || 'application/octet-stream',
      }));
    }

    // Direct buffer attachments (artwork + PO documents)
    let directBufferAttachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];

    if (data.autoAttachArtworkForVendor && data.communicationType === 'vendor_email') {
      directBufferAttachments = await this.fetchArtworkAttachments(orderId, data.autoAttachArtworkForVendor);
    }

    if (data.autoAttachDocumentFile?.fileUrl) {
      const docAttachment = await this.fetchDocumentAttachment(data.autoAttachDocumentFile);
      if (docAttachment) directBufferAttachments.push(docAttachment);
    }

    // Send email if direction is 'sent'
    if (data.direction === 'sent') {
      let bcc = data.bcc;
      if (data.fromEmail) {
        const existingBcc = bcc ? bcc.split(',').map((e: string) => e.trim()).filter(Boolean) : [];
        if (!existingBcc.includes(data.fromEmail)) {
          existingBcc.push(data.fromEmail);
        }
        bcc = existingBcc.join(', ');
      }

      try {
        const { emailService } = await import("./email.service");
        const order = await orderRepository.getOrder(orderId);
        const company = order?.companyId ? await companyRepository.getById(order.companyId) : null;
        const supplier = (order as any)?.supplierId ? await supplierRepository.getById((order as any).supplierId) : null;

        if (data.communicationType === 'client_email') {
          await emailService.sendClientEmail({
            userId,
            from: data.fromEmail,
            fromName: data.fromName || 'SwagSuite',
            to: data.recipientEmail,
            toName: data.recipientName,
            subject: data.subject,
            body: data.body,
            orderNumber: order?.orderNumber,
            companyName: company?.name,
            attachments: emailAttachments,
            directAttachments: directBufferAttachments.length > 0 ? directBufferAttachments : undefined,
            cc: data.cc,
            bcc,
          });
        } else if (data.communicationType === 'vendor_email') {
          await emailService.sendVendorEmail({
            userId,
            from: data.fromEmail,
            fromName: data.fromName || 'SwagSuite',
            to: data.recipientEmail,
            toName: data.recipientName,
            subject: data.subject,
            body: data.body,
            orderNumber: order?.orderNumber,
            supplierName: supplier?.name,
            attachments: emailAttachments,
            directAttachments: directBufferAttachments.length > 0 ? directBufferAttachments : undefined,
            cc: data.cc,
            bcc,
          });

          // PO tracking
          await this.trackPOSending(orderId, userId, data.subject, data.recipientName, data.recipientEmail, order);
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        return {
          ...communication,
          emailStatus: 'failed',
          emailError: emailError instanceof Error ? emailError.message : 'Unknown error',
        };
      }
    }

    return communicationRepository.getWithUser(communication.id);
  }

  async sendGeneralEmail(userId: string, data: {
    fromEmail?: string;
    fromName?: string;
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    companyName?: string;
  }) {
    const { emailService } = await import("./email.service");

    await emailService.sendClientEmail({
      userId,
      from: data.fromEmail,
      fromName: data.fromName,
      to: data.recipientEmail,
      toName: data.recipientName,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      body: data.body,
      companyName: data.companyName,
    });
  }

  private async fetchArtworkAttachments(orderId: string, vendorId: string) {
    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];

    try {
      const { artworkItems, orderItems: orderItemsTable } = await import("@shared/schema");
      const { eq, inArray } = await import("drizzle-orm");
      const axios = (await import('axios')).default;

      const orderItemsForVendor = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, orderId));

      const vendorItemIds = orderItemsForVendor
        .filter((item: any) => item.supplierId === vendorId)
        .map((item: any) => item.id);

      if (vendorItemIds.length > 0) {
        const artworks = await db
          .select()
          .from(artworkItems)
          .where(inArray(artworkItems.orderItemId, vendorItemIds));

        for (const art of artworks.filter((a: any) => a.filePath)) {
          try {
            const response = await axios.get(art.filePath!, { responseType: 'arraybuffer' });
            attachments.push({
              filename: art.fileName || art.name || 'artwork',
              content: Buffer.from(response.data),
              contentType: art.filePath!.match(/\.(png|jpg|jpeg|gif|svg)$/i)
                ? `image/${art.filePath!.match(/\.(\w+)$/)?.[1] || 'png'}`
                : 'application/octet-stream',
            });
          } catch (dlErr) {
            console.error(`Warning: Failed to download artwork file ${art.fileName}:`, (dlErr as any).message);
          }
        }
      }
    } catch (error) {
      console.error('Warning: Failed to auto-attach artwork files:', error);
    }

    return attachments;
  }

  private async fetchDocumentAttachment(doc: { fileUrl: string; fileName?: string }) {
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(doc.fileUrl, { responseType: 'arraybuffer' });
      return {
        filename: doc.fileName || 'purchase-order.pdf',
        content: Buffer.from(response.data),
        contentType: 'application/pdf',
      };
    } catch (error) {
      console.error('Warning: Failed to auto-attach document:', error);
      return null;
    }
  }

  private async trackPOSending(orderId: string, userId: string, subject: string, recipientName?: string, recipientEmail?: string, order?: any) {
    try {
      const poMatch = subject?.match(/Purchase Order #([A-Za-z0-9\-]+)/i);
      if (!poMatch || !order) return;

      const poNumber = poMatch[1];
      const { generatedDocuments, orders: ordersTable } = await import("@shared/schema");
      const { projectActivities } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      const [updatedDoc] = await db
        .update(generatedDocuments)
        .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(generatedDocuments.orderId, orderId),
            eq(generatedDocuments.documentNumber, poNumber),
            eq(generatedDocuments.documentType, "purchase_order")
          )
        )
        .returning();

      if (!updatedDoc) return;

      await db.insert(projectActivities).values({
        orderId,
        userId,
        activityType: "system_action",
        content: `Purchase Order #${poNumber} sent to ${recipientName || recipientEmail}`,
        metadata: { action: "po_sent", documentId: updatedDoc.id, vendorId: updatedDoc.vendorId, vendorName: updatedDoc.vendorName || recipientName },
        isSystemGenerated: false,
      });

      const allPOs = await db
        .select()
        .from(generatedDocuments)
        .where(
          and(
            eq(generatedDocuments.orderId, orderId),
            eq(generatedDocuments.documentType, "purchase_order")
          )
        );

      const allSent = allPOs.length > 0 && allPOs.every(po => po.status === "sent" || po.status === "approved");

      if (allSent && order.currentStage === "po-sent") {
        const existingStages = JSON.parse(JSON.stringify(order.stagesCompleted || '["created","submitted"]'));
        const stages = Array.isArray(existingStages) ? existingStages : JSON.parse(existingStages);
        if (!stages.includes("submitted")) stages.push("submitted");

        await db
          .update(ordersTable)
          .set({ currentStage: "submitted", stagesCompleted: JSON.stringify(stages), updatedAt: new Date() })
          .where(eq(ordersTable.id, orderId));

        await db.insert(projectActivities).values({
          orderId,
          userId,
          activityType: "status_change",
          content: `All Purchase Orders sent to vendors. Order moved to PO Placed stage.`,
          metadata: { action: "stage_change", oldStage: "po-sent", newStage: "submitted", totalPOs: allPOs.length },
          isSystemGenerated: true,
        });
      }
    } catch (error) {
      console.error('PO tracking failed (non-critical):', error);
    }
  }
}

export const communicationService = new CommunicationService();
