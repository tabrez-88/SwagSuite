import { desc, eq, like, sql } from "drizzle-orm";
import { db } from "../db";
import {
  companies,
  type Company,
  type InsertCompany,
} from "@shared/schema";

export class CompanyRepository {
  async getAll(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async getById(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async search(query: string): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(like(companies.name, `%${query}%`))
      .orderBy(desc(companies.createdAt));
  }

  async create(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async update(id: string, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async updateYtdSpend(id: string, ytdSpend: string): Promise<void> {
    await db
      .update(companies)
      .set({ ytdSpend })
      .where(eq(companies.id, id));
  }

  async delete(id: string): Promise<void> {
    const { contacts, orders, orderItems } = await import("@shared/schema");

    // Delete order items for orders belonging to this company
    const companyOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.companyId, id));

    const orderIds = companyOrders.map(o => o.id);
    if (orderIds.length > 0) {
      await db.delete(orderItems).where(
        sql`${orderItems.orderId} IN ${sql.raw(`(${orderIds.map(id => `'${id}'`).join(',')})`)}`
      );
    }

    await db.delete(orders).where(eq(orders.companyId, id));
    await db.delete(contacts).where(eq(contacts.companyId, id));
    await db.delete(companies).where(eq(companies.id, id));
  }
}

export const companyRepository = new CompanyRepository();
