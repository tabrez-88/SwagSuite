import { eq, asc } from "drizzle-orm";
import { db } from "../db";
import {
  shippingMethods,
  type ShippingMethod,
  type InsertShippingMethod,
} from "@shared/schema";

export class ShippingMethodRepository {
  async getAll(): Promise<ShippingMethod[]> {
    return db
      .select()
      .from(shippingMethods)
      .where(eq(shippingMethods.isActive, true))
      .orderBy(asc(shippingMethods.sortOrder));
  }

  async getById(id: string): Promise<ShippingMethod | undefined> {
    const [method] = await db
      .select()
      .from(shippingMethods)
      .where(eq(shippingMethods.id, id));
    return method;
  }

  async create(data: InsertShippingMethod): Promise<ShippingMethod> {
    const [method] = await db.insert(shippingMethods).values(data).returning();
    return method;
  }

  async update(id: string, data: Partial<InsertShippingMethod>): Promise<ShippingMethod> {
    const [updated] = await db
      .update(shippingMethods)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shippingMethods.id, id))
      .returning();
    return updated;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) =>
        db.update(shippingMethods)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(eq(shippingMethods.id, id))
      )
    );
  }

  async softDelete(id: string): Promise<void> {
    await db
      .update(shippingMethods)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(shippingMethods.id, id));
  }
}

export const shippingMethodRepository = new ShippingMethodRepository();
