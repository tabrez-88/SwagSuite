import { eq, desc, ilike, or, and } from "drizzle-orm";
import { db } from "../db";
import {
  integrationSettings,
  ssActivewearProducts,
  ssActivewearImportJobs,
  sageProducts,
  slackMessages,
  suppliers,
  type IntegrationSettings,
  type InsertIntegrationSettings,
  type SsActivewearProduct,
  type InsertSsActivewearProduct,
  type SsActivewearImportJob,
  type InsertSsActivewearImportJob,
  type SageProduct,
  type InsertSageProduct,
  type SlackMessage,
  type InsertSlackMessage,
  type Supplier,
} from "@shared/schema";

export class IntegrationRepository {
  // ── Integration Settings ──

  async getIntegrationSettings(): Promise<IntegrationSettings | undefined> {
    const [settings] = await db.select().from(integrationSettings).limit(1);
    return settings;
  }

  async upsertIntegrationSettings(
    settings: Partial<InsertIntegrationSettings>,
    userId?: string
  ): Promise<IntegrationSettings> {
    const existing = await this.getIntegrationSettings();

    const settingsData = {
      ...settings,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (existing) {
      const [updated] = await db
        .update(integrationSettings)
        .set(settingsData)
        .where(eq(integrationSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(integrationSettings)
        .values(settingsData as any)
        .returning();
      return created;
    }
  }

  async updateIntegrationSettings(
    settings: Partial<InsertIntegrationSettings>
  ): Promise<IntegrationSettings> {
    const existing = await this.getIntegrationSettings();

    if (existing) {
      const [updated] = await db
        .update(integrationSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(integrationSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(integrationSettings)
        .values({
          ...settings,
          updatedAt: new Date(),
        } as any)
        .returning();
      return created;
    }
  }

  // ── Slack Messages ──

  async getSlackMessages(): Promise<SlackMessage[]> {
    return await db
      .select()
      .from(slackMessages)
      .orderBy(desc(slackMessages.createdAt))
      .limit(100);
  }

  async createSlackMessage(message: InsertSlackMessage): Promise<SlackMessage> {
    const [newMessage] = await db
      .insert(slackMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // ── S&S Activewear Products ──

  async getSsActivewearProducts(): Promise<SsActivewearProduct[]> {
    return await db
      .select()
      .from(ssActivewearProducts)
      .where(eq(ssActivewearProducts.isActive, true))
      .orderBy(desc(ssActivewearProducts.updatedAt));
  }

  async getSsActivewearProductBySku(
    sku: string
  ): Promise<SsActivewearProduct | undefined> {
    const [product] = await db
      .select()
      .from(ssActivewearProducts)
      .where(eq(ssActivewearProducts.sku, sku));
    return product;
  }

  async createSsActivewearProduct(
    product: InsertSsActivewearProduct
  ): Promise<SsActivewearProduct> {
    const [newProduct] = await db
      .insert(ssActivewearProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateSsActivewearProduct(
    id: string,
    product: Partial<InsertSsActivewearProduct>
  ): Promise<SsActivewearProduct> {
    const [updatedProduct] = await db
      .update(ssActivewearProducts)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(ssActivewearProducts.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteSsActivewearProduct(id: string): Promise<void> {
    await db
      .update(ssActivewearProducts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(ssActivewearProducts.id, id));
  }

  async searchSsActivewearProducts(
    query: string
  ): Promise<SsActivewearProduct[]> {
    return await db
      .select()
      .from(ssActivewearProducts)
      .where(
        and(
          eq(ssActivewearProducts.isActive, true),
          or(
            ilike(ssActivewearProducts.sku, `%${query}%`),
            ilike(ssActivewearProducts.brandName, `%${query}%`),
            ilike(ssActivewearProducts.styleName, `%${query}%`),
            ilike(ssActivewearProducts.colorName, `%${query}%`)
          )
        )
      )
      .orderBy(desc(ssActivewearProducts.updatedAt))
      .limit(50);
  }

  // ── S&S Activewear Import Jobs ──

  async getSsActivewearImportJobs(
    userId?: string
  ): Promise<SsActivewearImportJob[]> {
    const query = db.select().from(ssActivewearImportJobs);

    if (userId) {
      query.where(eq(ssActivewearImportJobs.userId, userId));
    }

    return await query.orderBy(desc(ssActivewearImportJobs.createdAt));
  }

  async getSsActivewearImportJob(
    id: string
  ): Promise<SsActivewearImportJob | undefined> {
    const [job] = await db
      .select()
      .from(ssActivewearImportJobs)
      .where(eq(ssActivewearImportJobs.id, id));
    return job;
  }

  async createSsActivewearImportJob(
    job: InsertSsActivewearImportJob
  ): Promise<SsActivewearImportJob> {
    const [newJob] = await db
      .insert(ssActivewearImportJobs)
      .values(job)
      .returning();
    return newJob;
  }

  async updateSsActivewearImportJob(
    id: string,
    job: Partial<InsertSsActivewearImportJob>
  ): Promise<SsActivewearImportJob> {
    const [updatedJob] = await db
      .update(ssActivewearImportJobs)
      .set(job)
      .where(eq(ssActivewearImportJobs.id, id))
      .returning();
    return updatedJob;
  }

  // ── SAGE Products ──

  async getSageProductBySageId(
    sageId: string
  ): Promise<SageProduct | undefined> {
    const [product] = await db
      .select()
      .from(sageProducts)
      .where(eq(sageProducts.sageId, sageId))
      .limit(1);
    return product;
  }

  async getSageProducts(limit: number = 100): Promise<SageProduct[]> {
    return db
      .select()
      .from(sageProducts)
      .where(eq(sageProducts.syncStatus, "active"))
      .limit(limit)
      .orderBy(desc(sageProducts.lastSyncedAt));
  }

  async searchSageProducts(query: string): Promise<SageProduct[]> {
    return db
      .select()
      .from(sageProducts)
      .where(
        or(
          ilike(sageProducts.productName, `%${query}%`),
          ilike(sageProducts.productNumber, `%${query}%`),
          ilike(sageProducts.brand, `%${query}%`),
          ilike(sageProducts.category, `%${query}%`)
        )
      )
      .limit(50)
      .orderBy(desc(sageProducts.lastSyncedAt));
  }

  async createSageProduct(product: InsertSageProduct): Promise<string> {
    const [newProduct] = await db
      .insert(sageProducts)
      .values(product as any)
      .returning({ id: sageProducts.id });
    return newProduct.id;
  }

  async updateSageProduct(
    id: string,
    product: Partial<InsertSageProduct>
  ): Promise<SageProduct> {
    const [updated] = await db
      .update(sageProducts)
      .set({ ...product, lastSyncedAt: new Date() })
      .where(eq(sageProducts.id, id))
      .returning();
    return updated;
  }

  // ── Supplier by Sage ID ──

  async getSupplierBySageId(sageId: string): Promise<Supplier | undefined> {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.sageId, sageId))
      .limit(1);
    return supplier;
  }
}

export const integrationRepository = new IntegrationRepository();
