import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import {
  companyAddresses,
  type CompanyAddress,
  type InsertCompanyAddress,
} from "@shared/schema";

export class CompanyAddressRepository {
  async getByCompanyId(companyId: string): Promise<CompanyAddress[]> {
    return db
      .select()
      .from(companyAddresses)
      .where(eq(companyAddresses.companyId, companyId))
      .orderBy(desc(companyAddresses.isDefault), desc(companyAddresses.createdAt));
  }

  async getById(id: string): Promise<CompanyAddress | undefined> {
    const [address] = await db
      .select()
      .from(companyAddresses)
      .where(eq(companyAddresses.id, id));
    return address;
  }

  async create(data: InsertCompanyAddress): Promise<CompanyAddress> {
    const [address] = await db
      .insert(companyAddresses)
      .values(data)
      .returning();
    return address;
  }

  async update(id: string, data: Partial<InsertCompanyAddress>): Promise<CompanyAddress> {
    const [address] = await db
      .update(companyAddresses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companyAddresses.id, id))
      .returning();
    return address;
  }

  async delete(id: string): Promise<void> {
    await db.delete(companyAddresses).where(eq(companyAddresses.id, id));
  }

  async clearDefaults(companyId: string, addressType: string): Promise<void> {
    // Clear isDefault for addresses of the same type (or 'both')
    const types = addressType === "both" ? ["billing", "shipping", "both"] : [addressType, "both"];
    for (const type of types) {
      await db
        .update(companyAddresses)
        .set({ isDefault: false })
        .where(
          and(
            eq(companyAddresses.companyId, companyId),
            eq(companyAddresses.addressType, type),
            eq(companyAddresses.isDefault, true)
          )
        );
    }
  }
}

export const companyAddressRepository = new CompanyAddressRepository();
