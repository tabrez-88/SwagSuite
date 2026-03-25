import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import {
  supplierAddresses,
  type SupplierAddress,
  type InsertSupplierAddress,
} from "@shared/schema";

export class SupplierAddressRepository {
  async getBySupplierId(supplierId: string): Promise<SupplierAddress[]> {
    return db
      .select()
      .from(supplierAddresses)
      .where(eq(supplierAddresses.supplierId, supplierId))
      .orderBy(desc(supplierAddresses.isDefault), desc(supplierAddresses.createdAt));
  }

  async getById(id: string): Promise<SupplierAddress | undefined> {
    const [address] = await db
      .select()
      .from(supplierAddresses)
      .where(eq(supplierAddresses.id, id));
    return address;
  }

  async create(data: InsertSupplierAddress): Promise<SupplierAddress> {
    const [address] = await db
      .insert(supplierAddresses)
      .values(data)
      .returning();
    return address;
  }

  async update(id: string, data: Partial<InsertSupplierAddress>): Promise<SupplierAddress> {
    const [address] = await db
      .update(supplierAddresses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(supplierAddresses.id, id))
      .returning();
    return address;
  }

  async delete(id: string): Promise<void> {
    await db.delete(supplierAddresses).where(eq(supplierAddresses.id, id));
  }

  async clearDefaults(supplierId: string, addressType: string): Promise<void> {
    const types = addressType === "both" ? ["billing", "shipping", "both"] : [addressType, "both"];
    for (const type of types) {
      await db
        .update(supplierAddresses)
        .set({ isDefault: false })
        .where(
          and(
            eq(supplierAddresses.supplierId, supplierId),
            eq(supplierAddresses.addressType, type),
            eq(supplierAddresses.isDefault, true)
          )
        );
    }
  }
}

export const supplierAddressRepository = new SupplierAddressRepository();
