import { desc, eq } from "drizzle-orm";
import { db } from "../db";

export class LeadRepository {
  async getAll(): Promise<any[]> {
    const { leads } = await import("@shared/schema");
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getById(id: string): Promise<any | undefined> {
    const { leads } = await import("@shared/schema");
    const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return lead;
  }

  async create(lead: any): Promise<any> {
    const { leads } = await import("@shared/schema");
    const [created] = await db.insert(leads).values(lead).returning();
    return created;
  }

  async update(id: string, lead: any): Promise<any> {
    const { leads } = await import("@shared/schema");
    const [updated] = await db
      .update(leads)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<void> {
    const { leads } = await import("@shared/schema");
    await db.delete(leads).where(eq(leads.id, id));
  }
}

export const leadRepository = new LeadRepository();
