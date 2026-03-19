import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db";
import {
  customerPortalTokens,
  type CustomerPortalToken,
  type InsertCustomerPortalToken,
} from "@shared/schema";

export class PortalRepository {
  async getCustomerPortalTokensByOrder(orderId: string): Promise<CustomerPortalToken[]> {
    return db
      .select()
      .from(customerPortalTokens)
      .where(eq(customerPortalTokens.orderId, orderId))
      .orderBy(desc(customerPortalTokens.createdAt));
  }

  async getCustomerPortalTokenByToken(token: string): Promise<CustomerPortalToken | undefined> {
    const [result] = await db
      .select()
      .from(customerPortalTokens)
      .where(eq(customerPortalTokens.token, token));
    return result;
  }

  async createCustomerPortalToken(tokenData: InsertCustomerPortalToken): Promise<CustomerPortalToken> {
    const [newToken] = await db.insert(customerPortalTokens).values(tokenData).returning();
    return newToken;
  }

  async updateCustomerPortalToken(id: string, data: Partial<InsertCustomerPortalToken>): Promise<CustomerPortalToken> {
    const [updated] = await db
      .update(customerPortalTokens)
      .set(data)
      .where(eq(customerPortalTokens.id, id))
      .returning();
    return updated;
  }

  async getActivePortalTokenForOrder(orderId: string): Promise<CustomerPortalToken | undefined> {
    const [token] = await db
      .select()
      .from(customerPortalTokens)
      .where(
        and(
          eq(customerPortalTokens.orderId, orderId),
          eq(customerPortalTokens.isActive, true),
        )
      )
      .orderBy(desc(customerPortalTokens.createdAt))
      .limit(1);
    return token;
  }

  async getActivePortalTokenByType(orderId: string, tokenType: string): Promise<CustomerPortalToken | undefined> {
    const [token] = await db
      .select()
      .from(customerPortalTokens)
      .where(
        and(
          eq(customerPortalTokens.orderId, orderId),
          eq(customerPortalTokens.isActive, true),
          eq(customerPortalTokens.tokenType, tokenType),
        )
      )
      .orderBy(desc(customerPortalTokens.createdAt))
      .limit(1);
    return token;
  }

  async incrementPortalTokenAccess(id: string): Promise<void> {
    await db
      .update(customerPortalTokens)
      .set({
        accessCount: sql`COALESCE(${customerPortalTokens.accessCount}, 0) + 1`,
        lastViewedAt: new Date(),
      })
      .where(eq(customerPortalTokens.id, id));
  }

  async deactivatePortalToken(id: string): Promise<void> {
    await db
      .update(customerPortalTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customerPortalTokens.id, id));
  }

  async deleteCustomerPortalToken(id: string): Promise<void> {
    await db.delete(customerPortalTokens).where(eq(customerPortalTokens.id, id));
  }
}

export const portalRepository = new PortalRepository();
