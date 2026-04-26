import { Request, Response } from "express";
import { purchaseOrderRepository } from "../repositories/purchase-order.repository";
import crypto from "crypto";

export class PurchaseOrderController {
  /** GET /api/orders/:orderId/purchase-orders */
  static async listByOrder(req: Request, res: Response) {
    const pos = await purchaseOrderRepository.getByOrder(req.params.orderId);
    // Include items for each PO
    const result = await Promise.all(
      pos.map(async (po) => {
        const items = await purchaseOrderRepository.getItems(po.id);
        return { ...po, items: items.map((i) => i.orderItemId) };
      })
    );
    res.json(result);
  }

  /** POST /api/orders/:orderId/purchase-orders */
  static async create(req: Request, res: Response) {
    const { orderId } = req.params;
    const { poNumber, vendorId, vendorRole, groupKey, currentStageId, documentId, orderItemIds, metadata } = req.body;

    // Check if PO already exists for this groupKey
    const existing = await purchaseOrderRepository.getByGroupKey(orderId, groupKey);
    if (existing) {
      return res.status(409).json({ message: "PO already exists for this group", purchaseOrder: existing });
    }

    const po = await purchaseOrderRepository.create({
      orderId,
      poNumber,
      vendorId,
      vendorRole: vendorRole || "supplier",
      groupKey,
      currentStageId: currentStageId || null,
      documentId: documentId || null,
      metadata: metadata || {},
    });

    // Set junction items
    if (orderItemIds?.length > 0) {
      await purchaseOrderRepository.setItems(po.id, orderItemIds);
    }

    res.status(201).json({ ...po, items: orderItemIds || [] });
  }

  /** PUT /api/purchase-orders/:id */
  static async update(req: Request, res: Response) {
    const existing = await purchaseOrderRepository.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    const { orderItemIds, ...updates } = req.body;
    const updated = await purchaseOrderRepository.update(req.params.id, updates);

    if (orderItemIds) {
      await purchaseOrderRepository.setItems(req.params.id, orderItemIds);
    }

    res.json(updated);
  }

  /** PUT /api/purchase-orders/:id/advance-stage */
  static async advanceStage(req: Request, res: Response) {
    const existing = await purchaseOrderRepository.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    const { stageId } = req.body;
    if (!stageId) {
      return res.status(400).json({ message: "stageId is required" });
    }

    // Update stage + set lifecycle timestamp if applicable
    const lifecycleUpdates: Record<string, unknown> = { currentStageId: stageId };

    // Dynamic import to get stage flags
    const { productionStages } = await import("@shared/schema");
    const { db } = await import("../db");
    const { eq } = await import("drizzle-orm");
    const [stage] = await db.select().from(productionStages).where(eq(productionStages.id, stageId));

    if (stage) {
      if (stage.onEmailSent) lifecycleUpdates.submittedAt = new Date();
      if (stage.onVendorConfirm) lifecycleUpdates.confirmedAt = new Date();
      if (stage.onBilling) lifecycleUpdates.billedAt = new Date();
      if (stage.isFinal) lifecycleUpdates.closedAt = new Date();
    }

    const updated = await purchaseOrderRepository.update(req.params.id, lifecycleUpdates);
    res.json(updated);
  }

  /** POST /api/purchase-orders/:id/regenerate */
  static async regenerate(req: Request, res: Response) {
    const existing = await purchaseOrderRepository.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    const { documentId } = req.body;
    const updated = await purchaseOrderRepository.update(req.params.id, {
      documentId: documentId || existing.documentId,
    });
    res.json(updated);
  }

  /** POST /api/purchase-orders/:id/send-confirmation */
  static async sendConfirmation(req: Request, res: Response) {
    const existing = await purchaseOrderRepository.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await purchaseOrderRepository.update(req.params.id, {
      confirmationToken: token,
      confirmationTokenExpiresAt: expiresAt,
    });

    res.json({
      token,
      portalUrl: `/vendor-portal/po/${token}`,
      expiresAt: expiresAt.toISOString(),
    });
  }

  /** DELETE /api/purchase-orders/:id */
  static async delete(req: Request, res: Response) {
    const existing = await purchaseOrderRepository.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    await purchaseOrderRepository.delete(req.params.id);
    res.status(204).send();
  }

  // ── Vendor Portal (public, no auth) ──

  /** GET /api/vendor-portal/po/:token */
  static async getByToken(req: Request, res: Response) {
    const po = await purchaseOrderRepository.getByToken(req.params.token);
    if (!po) {
      return res.status(404).json({ message: "Purchase order not found or link expired" });
    }
    if (po.confirmationTokenExpiresAt && new Date() > new Date(po.confirmationTokenExpiresAt)) {
      return res.status(410).json({ message: "Confirmation link has expired" });
    }

    // Get document info
    const { generatedDocuments } = await import("@shared/schema");
    const { db } = await import("../db");
    const { eq } = await import("drizzle-orm");
    let document = null;
    if (po.documentId) {
      const [doc] = await db.select().from(generatedDocuments).where(eq(generatedDocuments.id, po.documentId));
      document = doc || null;
    }

    // Get order info
    const { orders } = await import("@shared/schema");
    const [order] = await db.select().from(orders).where(eq(orders.id, po.orderId));

    res.json({
      purchaseOrder: {
        id: po.id,
        poNumber: po.poNumber,
        vendorRole: po.vendorRole,
        metadata: po.metadata,
        vendorNotes: po.vendorNotes,
        confirmedAt: po.confirmedAt,
        submittedAt: po.submittedAt,
      },
      document: document ? {
        id: document.id,
        documentNumber: document.documentNumber,
        fileUrl: document.fileUrl,
      } : null,
      order: order ? {
        orderNumber: order.orderNumber,
        companyId: order.companyId,
      } : null,
    });
  }

  /** POST /api/vendor-portal/po/:token/confirm */
  static async confirmByToken(req: Request, res: Response) {
    const po = await purchaseOrderRepository.getByToken(req.params.token);
    if (!po) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    if (po.confirmationTokenExpiresAt && new Date() > new Date(po.confirmationTokenExpiresAt)) {
      return res.status(410).json({ message: "Confirmation link has expired" });
    }
    if (po.confirmedAt) {
      return res.status(200).json({ message: "Already confirmed", purchaseOrder: po });
    }

    // Find the stage with onVendorConfirm flag
    const { productionStages } = await import("@shared/schema");
    const { db } = await import("../db");
    const { eq } = await import("drizzle-orm");
    const stages = await db.select().from(productionStages).where(eq(productionStages.isActive, true));
    const confirmStage = stages.find((s) => s.onVendorConfirm);

    const updates: Record<string, unknown> = {
      confirmedAt: new Date(),
      vendorNotes: req.body.notes || po.vendorNotes,
    };
    if (confirmStage) {
      updates.currentStageId = confirmStage.id;
    }

    const updated = await purchaseOrderRepository.update(po.id, updates);
    res.json({ message: "PO confirmed", purchaseOrder: updated });
  }

  /** POST /api/vendor-portal/po/:token/request-changes */
  static async requestChangesByToken(req: Request, res: Response) {
    const po = await purchaseOrderRepository.getByToken(req.params.token);
    if (!po) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    if (po.confirmationTokenExpiresAt && new Date() > new Date(po.confirmationTokenExpiresAt)) {
      return res.status(410).json({ message: "Confirmation link has expired" });
    }

    const updated = await purchaseOrderRepository.update(po.id, {
      vendorNotes: req.body.notes || "Changes requested by vendor",
    });

    res.json({ message: "Change request submitted", purchaseOrder: updated });
  }
}
