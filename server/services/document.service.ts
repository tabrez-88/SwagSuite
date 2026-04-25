import { documentRepository } from "../repositories/document.repository";
import { productionRepository } from "../repositories/production.repository";
import { db } from "../db";

export class DocumentService {
  async getByOrderId(orderId: string) {
    return documentRepository.getByOrderId(orderId);
  }

  async create(orderId: string, userId: string, data: {
    documentType: string;
    documentNumber?: string;
    vendorId?: string;
    vendorName?: string;
    status?: string;
    metadata?: any;
    file: Express.Multer.File;
  }) {
    // Delete existing duplicates
    const existingDocs = await documentRepository.findExisting(orderId, data.documentType, data.vendorId);

    if (existingDocs.length > 0) {
      for (const oldDoc of existingDocs) {
        if (oldDoc.metadata && (oldDoc.metadata as any).cloudinaryPublicId) {
          try {
            const { deleteFromCloudinary } = await import("../config/cloudinary");
            await deleteFromCloudinary((oldDoc.metadata as any).cloudinaryPublicId);
          } catch (e) {
            console.error("Error deleting old file from Cloudinary:", e);
          }
        }
        await documentRepository.delete(oldDoc.id);
      }
    }

    // Get Cloudinary file info
    const fileUrl = (data.file as any).path;
    const fileName = data.file.originalname;
    const fileSize = data.file.size;
    const cloudinaryPublicId = (data.file as any).filename;

    // Generate preview URL
    const { getPreviewUrl } = await import("../config/cloudinary");
    const previewUrl = getPreviewUrl(cloudinaryPublicId);

    const updatedMetadata = {
      ...data.metadata,
      cloudinaryPublicId,
      cloudinaryUrl: fileUrl,
      previewUrl,
    };

    const document = await documentRepository.create({
      orderId,
      documentType: data.documentType,
      documentNumber: data.documentNumber || "",
      vendorId: data.vendorId || null,
      vendorName: data.vendorName || null,
      fileUrl,
      fileName,
      fileSize,
      status: data.status || "draft",
      generatedBy: userId,
      metadata: updatedMetadata,
    });

    // Update pending approvals for quote/SO documents
    if (data.documentType === "quote" || data.documentType === "sales_order") {
      const count = await documentRepository.updatePendingApprovals(orderId, document.id, fileUrl);
      if (count > 0) {
        console.log(`Updated ${count} approval(s) to new document ${document.id}`);
      }
    }

    return document;
  }

  async preview(documentId: string) {
    const document = await documentRepository.getById(documentId);

    if (!document) return null;
    if (!document.fileUrl) return { error: "no_url" };

    const response = await fetch(document.fileUrl);
    if (!response.ok) throw new Error("Failed to fetch PDF from Cloudinary");

    const buffer = await response.arrayBuffer();

    return {
      buffer: Buffer.from(buffer),
      fileName: document.fileName,
      byteLength: buffer.byteLength,
    };
  }

  async update(documentId: string, data: { status?: string; sentAt?: string; metadata?: any }) {
    const updated = await documentRepository.update(documentId, {
      status: data.status,
      sentAt: data.sentAt ? new Date(data.sentAt) : undefined,
      metadata: data.metadata,
    });

    // PO → SO Auto-Transition
    if (data.metadata?.poStage && updated.orderId && updated.documentType === "purchase_order") {
      await this.checkPOAutoTransition(updated.orderId, data.metadata.poStage);
    }

    return updated;
  }

  async deleteDocument(documentId: string) {
    const document = await documentRepository.getById(documentId);

    if (document) {
      const cloudinaryPublicId = (document.metadata as any)?.cloudinaryPublicId;
      if (cloudinaryPublicId) {
        try {
          const { cloudinary } = await import("../config/cloudinary");
          await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: "raw" });
        } catch (err) {
          console.error("Error deleting file from Cloudinary:", err);
        }
      }
    }

    await documentRepository.delete(documentId);
  }

  private async checkPOAutoTransition(orderId: string, _triggerStage: string) {
    try {
      const allPOs = await documentRepository.getAllPOsForOrder(orderId);
      if (allPOs.length === 0) return;

      // Dynamic stage order from DB
      const dbStages = await productionRepository.getProductionStages();
      const stageOrder: Record<string, number> = {};
      for (const s of dbStages) {
        stageOrder[s.id] = s.order;
      }
      const initialStage = dbStages.find(s => s.isInitial) || dbStages[0];
      const initialStageId = initialStage?.id || 'created';

      const allStages = allPOs.map((po: any) => {
        const m = typeof po.metadata === "string" ? JSON.parse(po.metadata) : (po.metadata || {});
        return m.poStage || initialStageId;
      });

      const minStageOrder = Math.min(...allStages.map((s: string) => stageOrder[s] || 1));

      const { orders } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [currentOrder] = await db
        .select({ salesOrderStatus: orders.salesOrderStatus })
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!currentOrder) return;

      let newSOStatus: string | null = null;
      const currentSO = currentOrder.salesOrderStatus || "";

      // Use stage order positions: ~60% through = shipped, ~75% through = ready_to_invoice
      const totalStages = dbStages.length;
      const shippedThreshold = Math.ceil(totalStages * 0.6);
      const billingThreshold = Math.ceil(totalStages * 0.75);

      if (minStageOrder >= shippedThreshold && ["client_approved", "in_production"].includes(currentSO)) {
        newSOStatus = "shipped";
      }
      if (minStageOrder >= billingThreshold && ["client_approved", "in_production", "shipped"].includes(currentSO)) {
        newSOStatus = "ready_to_invoice";
      }

      if (newSOStatus && newSOStatus !== currentSO) {
        await db
          .update(orders)
          .set({ salesOrderStatus: newSOStatus, updatedAt: new Date() })
          .where(eq(orders.id, orderId));

        const { projectActivities } = await import("@shared/schema");
        await db.insert(projectActivities).values({
          orderId,
          userId: "system",
          activityType: "system_action",
          content: `Sales Order auto-transitioned to "${newSOStatus === "ready_to_invoice" ? "Ready to Invoice" : "Shipped"}" — all POs reached ${allStages[0]} stage`,
          metadata: {
            action: "po_auto_transition",
            previousStatus: currentSO,
            newStatus: newSOStatus,
          },
          isSystemGenerated: true,
        } as any);

        console.log(`[PO→SO Auto] Order ${orderId}: SO status ${currentSO} → ${newSOStatus}`);
      }
    } catch (autoErr) {
      console.error("[PO→SO Auto] Error checking auto-transition:", autoErr);
    }
  }
}

export const documentService = new DocumentService();
