import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import {
  purchaseOrders,
  purchaseOrderItems,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type PurchaseOrderItem,
} from "@shared/schema";

export class PurchaseOrderRepository {
  /** Get all POs for an order */
  async getByOrder(orderId: string): Promise<PurchaseOrder[]> {
    return db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.orderId, orderId))
      .orderBy(desc(purchaseOrders.createdAt));
  }

  /** Get PO by ID */
  async getById(id: string): Promise<PurchaseOrder | undefined> {
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id));
    return po;
  }

  /** Get PO by confirmation token */
  async getByToken(token: string): Promise<PurchaseOrder | undefined> {
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.confirmationToken, token));
    return po;
  }

  /** Get PO by groupKey within an order */
  async getByGroupKey(orderId: string, groupKey: string): Promise<PurchaseOrder | undefined> {
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.orderId, orderId),
          eq(purchaseOrders.groupKey, groupKey),
        )
      );
    return po;
  }

  /** Create PO */
  async create(data: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [po] = await db.insert(purchaseOrders).values(data).returning();
    return po;
  }

  /** Update PO */
  async update(id: string, data: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder> {
    const [updated] = await db
      .update(purchaseOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updated;
  }

  /** Delete PO and its items (cascade) */
  async delete(id: string): Promise<void> {
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  }

  /** Get PO items (junction rows) */
  async getItems(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
    return db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
  }

  /** Set PO items (replace all) */
  async setItems(purchaseOrderId: string, orderItemIds: string[]): Promise<void> {
    // Delete existing
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
    // Insert new
    if (orderItemIds.length > 0) {
      await db.insert(purchaseOrderItems).values(
        orderItemIds.map((orderItemId) => ({
          purchaseOrderId,
          orderItemId,
        }))
      );
    }
  }

  /** Advance stage */
  async advanceStage(id: string, stageId: string): Promise<PurchaseOrder> {
    return this.update(id, { currentStageId: stageId });
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
