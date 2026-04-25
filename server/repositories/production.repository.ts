import { eq, and, ne, sql } from "drizzle-orm";
import { db } from "../db";
import {
  productionStages,
  nextActionTypes,
  type ProductionStage,
  type InsertProductionStage,
  type NextActionType,
  type InsertNextActionType,
} from "@shared/schema";

export class ProductionRepository {
  // ── Production Stages ──

  async getProductionStages(): Promise<ProductionStage[]> {
    return await db.select().from(productionStages).where(eq(productionStages.isActive, true)).orderBy(productionStages.order);
  }

  async getProductionStage(id: string): Promise<ProductionStage | undefined> {
    const [stage] = await db.select().from(productionStages).where(eq(productionStages.id, id));
    return stage;
  }

  async createProductionStage(stage: InsertProductionStage): Promise<ProductionStage> {
    const [created] = await db.insert(productionStages).values(stage).returning();
    return created;
  }

  async updateProductionStage(id: string, stage: Partial<InsertProductionStage>): Promise<ProductionStage> {
    const [updated] = await db
      .update(productionStages)
      .set({ ...stage, updatedAt: new Date() })
      .where(eq(productionStages.id, id))
      .returning();
    return updated;
  }

  async deleteProductionStage(id: string): Promise<void> {
    await db.update(productionStages)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(productionStages.id, id));
  }

  async reorderProductionStages(stageIds: string[]): Promise<ProductionStage[]> {
    for (let i = 0; i < stageIds.length; i++) {
      await db
        .update(productionStages)
        .set({ order: i + 1, updatedAt: new Date() })
        .where(eq(productionStages.id, stageIds[i]));
    }
    return this.getProductionStages();
  }

  async seedDefaultProductionStages(): Promise<void> {
    const existing = await db.select().from(productionStages).limit(1);
    if (existing.length > 0) return; // Already seeded

    const defaults: InsertProductionStage[] = [
      { id: 'created', name: 'Created', order: 1, color: 'bg-gray-100 text-gray-700', icon: 'FileText', description: 'PO created, not yet sent to vendor', isInitial: true },
      { id: 'submitted', name: 'Submitted', order: 2, color: 'bg-blue-100 text-blue-800', icon: 'Send', description: 'PO sent to vendor', onEmailSent: true },
      { id: 'confirmed', name: 'Confirmed', order: 3, color: 'bg-green-100 text-green-800', icon: 'CheckCircle', description: 'Vendor confirmed the order', onVendorConfirm: true },
      { id: 'in_production', name: 'In Production', order: 4, color: 'bg-purple-100 text-purple-800', icon: 'Factory', description: 'Vendor is producing the order' },
      { id: 'shipped', name: 'Shipped', order: 5, color: 'bg-indigo-100 text-indigo-800', icon: 'Truck', description: 'Order shipped from vendor' },
      { id: 'ready_for_billing', name: 'Ready for Billing', order: 6, color: 'bg-teal-100 text-teal-800', icon: 'Receipt', description: 'Ready to create vendor bill' },
      { id: 'billed', name: 'Billed', order: 7, color: 'bg-orange-100 text-orange-800', icon: 'CreditCard', description: 'Vendor bill recorded', isFinal: true, onBilling: true },
      { id: 'closed', name: 'Closed', order: 8, color: 'bg-red-100 text-red-800', icon: 'Lock', description: 'PO fully complete', isFinal: true },
    ];

    await db.insert(productionStages).values(defaults);
  }

  // ── Stage Flag Queries ──

  async getInitialStage(): Promise<ProductionStage | undefined> {
    const [stage] = await db.select().from(productionStages)
      .where(and(eq(productionStages.isActive, true), eq(productionStages.isInitial, true)));
    if (stage) return stage;
    // Fallback: first active stage by order
    const [first] = await db.select().from(productionStages)
      .where(eq(productionStages.isActive, true))
      .orderBy(productionStages.order)
      .limit(1);
    return first;
  }

  async getFinalStageIds(): Promise<string[]> {
    const stages = await db.select({ id: productionStages.id }).from(productionStages)
      .where(and(eq(productionStages.isActive, true), eq(productionStages.isFinal, true)));
    return stages.map(s => s.id);
  }

  async getStageByFlag(flag: 'onEmailSent' | 'onVendorConfirm' | 'onBilling'): Promise<ProductionStage | undefined> {
    const [stage] = await db.select().from(productionStages)
      .where(and(eq(productionStages.isActive, true), eq(productionStages[flag], true)));
    return stage;
  }

  /** Toggle a single-only flag: auto-disable on other stages first. `isFinal` skips auto-disable. */
  async setStageFlag(stageId: string, flag: keyof Pick<InsertProductionStage, 'isInitial' | 'isFinal' | 'onEmailSent' | 'onVendorConfirm' | 'onBilling'>, value: boolean): Promise<void> {
    if (value && flag !== 'isFinal') {
      // Auto-disable same flag on all other stages
      await db.update(productionStages)
        .set({ [flag]: false, updatedAt: new Date() })
        .where(ne(productionStages.id, stageId));
    }
    await db.update(productionStages)
      .set({ [flag]: value, updatedAt: new Date() })
      .where(eq(productionStages.id, stageId));
  }

  // ── Next Action Types ──

  async getNextActionTypes(): Promise<NextActionType[]> {
    return await db.select().from(nextActionTypes).where(eq(nextActionTypes.isActive, true)).orderBy(nextActionTypes.order);
  }

  async getNextActionType(id: string): Promise<NextActionType | undefined> {
    const [type] = await db.select().from(nextActionTypes).where(eq(nextActionTypes.id, id));
    return type;
  }

  async createNextActionType(type: InsertNextActionType): Promise<NextActionType> {
    const [created] = await db.insert(nextActionTypes).values(type).returning();
    return created;
  }

  async updateNextActionType(id: string, data: Partial<InsertNextActionType>): Promise<NextActionType> {
    const [updated] = await db
      .update(nextActionTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(nextActionTypes.id, id))
      .returning();
    return updated;
  }

  async deleteNextActionType(id: string): Promise<void> {
    await db.update(nextActionTypes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(nextActionTypes.id, id));
  }

  async reorderNextActionTypes(typeIds: string[]): Promise<NextActionType[]> {
    for (let i = 0; i < typeIds.length; i++) {
      await db
        .update(nextActionTypes)
        .set({ order: i + 1, updatedAt: new Date() })
        .where(eq(nextActionTypes.id, typeIds[i]));
    }
    return this.getNextActionTypes();
  }

  async seedDefaultNextActionTypes(): Promise<void> {
    const existing = await db.select().from(nextActionTypes).limit(1);
    if (existing.length > 0) return;

    const defaults: InsertNextActionType[] = [
      { id: 'no_action', name: 'No Action Required', order: 1, color: 'bg-gray-100 text-gray-700', icon: 'Circle', description: 'No follow-up needed at this time' },
      { id: 'follow_up_vendor', name: 'Follow Up with Vendor', order: 2, color: 'bg-blue-100 text-blue-800', icon: 'Phone', description: 'Contact vendor for order status update' },
      { id: 'request_proof', name: 'Request Proof', order: 3, color: 'bg-purple-100 text-purple-800', icon: 'Image', description: 'Request proof from vendor' },
      { id: 'review_proof', name: 'Review Proof', order: 4, color: 'bg-indigo-100 text-indigo-800', icon: 'Eye', description: 'Review received proof' },
      { id: 'waiting_approval', name: 'Waiting for Approval', order: 5, color: 'bg-yellow-100 text-yellow-800', icon: 'Clock', description: 'Waiting for client approval' },
      { id: 'confirm_ship_date', name: 'Confirm Ship Date', order: 6, color: 'bg-cyan-100 text-cyan-800', icon: 'Calendar', description: 'Confirm shipping date with vendor' },
      { id: 'request_tracking', name: 'Request Tracking', order: 7, color: 'bg-emerald-100 text-emerald-800', icon: 'Truck', description: 'Request tracking number from vendor' },
      { id: 'check_production', name: 'Check Production Status', order: 8, color: 'bg-orange-100 text-orange-800', icon: 'Factory', description: 'Check on production progress' },
      { id: 'review_invoice', name: 'Review Invoice', order: 9, color: 'bg-red-100 text-red-800', icon: 'Receipt', description: 'Review vendor invoice/bill' },
    ];

    await db.insert(nextActionTypes).values(defaults);
  }
}

export const productionRepository = new ProductionRepository();
