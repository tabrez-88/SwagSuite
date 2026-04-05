import { desc, eq, ilike } from "drizzle-orm";
import { db } from "../db";
import {
  suppliers,
  type Supplier,
  type InsertSupplier,
} from "@shared/schema";

export class SupplierRepository {
  async getAll(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getById(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async getByName(name: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(ilike(suppliers.name, name));
    return supplier;
  }

  async create(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async update(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async updateStats(id: string, ytdSpend: string, productCount: number): Promise<void> {
    await db
      .update(suppliers)
      .set({ ytdSpend, productCount })
      .where(eq(suppliers.id, id));
  }

  async getBySageId(sageId: string): Promise<Supplier | undefined> {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.sageId, sageId))
      .limit(1);
    return supplier;
  }

  async delete(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }
}

export const supplierRepository = new SupplierRepository();
