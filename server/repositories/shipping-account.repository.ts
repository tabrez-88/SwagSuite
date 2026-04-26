import { eq, and, desc, isNull } from "drizzle-orm";
import { db } from "../db";
import {
  shippingAccounts,
  type ShippingAccount,
  type InsertShippingAccount,
} from "@shared/schema";

export class ShippingAccountRepository {
  /** Get org-level accounts (ownerType = "organization") */
  async getOrgAccounts(): Promise<ShippingAccount[]> {
    return db
      .select()
      .from(shippingAccounts)
      .where(
        and(
          eq(shippingAccounts.ownerType, "organization"),
          isNull(shippingAccounts.ownerId),
          eq(shippingAccounts.isActive, true),
        )
      )
      .orderBy(desc(shippingAccounts.createdAt));
  }

  /** Get accounts for a specific company */
  async getByCompany(companyId: string): Promise<ShippingAccount[]> {
    return db
      .select()
      .from(shippingAccounts)
      .where(
        and(
          eq(shippingAccounts.ownerType, "company"),
          eq(shippingAccounts.ownerId, companyId),
          eq(shippingAccounts.isActive, true),
        )
      )
      .orderBy(desc(shippingAccounts.createdAt));
  }

  async getById(id: string): Promise<ShippingAccount | undefined> {
    const [account] = await db
      .select()
      .from(shippingAccounts)
      .where(eq(shippingAccounts.id, id));
    return account;
  }

  async create(data: InsertShippingAccount): Promise<ShippingAccount> {
    const [account] = await db.insert(shippingAccounts).values(data).returning();
    return account;
  }

  async update(id: string, data: Partial<InsertShippingAccount>): Promise<ShippingAccount> {
    const [updated] = await db
      .update(shippingAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shippingAccounts.id, id))
      .returning();
    return updated;
  }

  /** Soft delete — sets isActive = false */
  async softDelete(id: string): Promise<void> {
    await db
      .update(shippingAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(shippingAccounts.id, id));
  }
}

export const shippingAccountRepository = new ShippingAccountRepository();
