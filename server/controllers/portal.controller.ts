import type { Request, Response } from "express";
import crypto from "crypto";
import { orderRepository } from "../repositories/order.repository";
import { portalRepository } from "../repositories/portal.repository";
import { shipmentRepository } from "../repositories/shipment.repository";

export class PortalController {
  static async listTokens(req: Request, res: Response) {
    const tokens = await portalRepository.getCustomerPortalTokensByOrder(req.params.orderId);
    res.json(tokens);
  }

  static async createToken(req: Request, res: Response) {
    const { insertCustomerPortalTokenSchema } = await import("@shared/schema");
    const validatedData = insertCustomerPortalTokenSchema.parse({
      ...req.body,
      orderId: req.params.orderId,
      token: crypto.randomUUID(),
    });
    const portalToken = await portalRepository.createCustomerPortalToken(validatedData);
    res.status(201).json(portalToken);
  }

  static async deleteToken(req: Request, res: Response) {
    await portalRepository.deleteCustomerPortalToken(req.params.tokenId);
    res.status(204).send();
  }

  /** Public endpoint — no auth required */
  static async getPortal(req: Request, res: Response) {
    const portalToken = await portalRepository.getCustomerPortalTokenByToken(req.params.token);

    if (!portalToken) {
      return res.status(404).json({ message: "Portal link not found" });
    }

    if (!portalToken.isActive) {
      return res.status(403).json({ message: "This portal link has been deactivated" });
    }

    if (portalToken.expiresAt && new Date(portalToken.expiresAt) < new Date()) {
      return res.status(403).json({ message: "This portal link has expired" });
    }

    // Increment access count and update lastViewedAt
    await portalRepository.incrementPortalTokenAccess(portalToken.id);

    // Fetch order details without sensitive cost/margin/vendor information
    const order = await orderRepository.getOrder(portalToken.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const items = await orderRepository.getOrderItems(portalToken.orderId);
    const shipments = await shipmentRepository.getOrderShipments(portalToken.orderId);

    // Strip sensitive fields from order
    const {
      profitMargin, costTotal, ...safeOrder
    } = order as any;

    // Strip sensitive fields from items (cost, margin, vendor details)
    const safeItems = items.map((item: any) => {
      const { unitCost, totalCost, marginPercent, marginAmount, supplierId, supplierSku, ...safeItem } = item;
      return safeItem;
    });

    res.json({
      order: safeOrder,
      items: safeItems,
      shipments,
    });
  }
}
