import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  contacts,
  type Contact,
  type InsertContact,
} from "@shared/schema";

export class ContactRepository {
  async getAll(companyId?: string, supplierId?: string): Promise<Contact[]> {
    const query = db.select().from(contacts);
    if (companyId) {
      return await query.where(eq(contacts.companyId, companyId));
    }
    if (supplierId) {
      return await query.where(eq(contacts.supplierId, supplierId)).orderBy(desc(contacts.createdAt));
    }
    return await query.orderBy(desc(contacts.createdAt));
  }

  async getById(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async create(contact: InsertContact): Promise<Contact> {
    // If creating as primary, unset other primary contacts for same company/supplier
    if (contact.isPrimary === true) {
      if (contact.companyId) {
        await db
          .update(contacts)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(eq(contacts.companyId, contact.companyId));
      }
      if (contact.supplierId) {
        await db
          .update(contacts)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(eq(contacts.supplierId, contact.supplierId));
      }
    }

    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async update(id: string, contact: Partial<InsertContact>): Promise<Contact> {
    // If setting as primary, unset other primary contacts
    if (contact.isPrimary === true) {
      const [currentContact] = await db.select().from(contacts).where(eq(contacts.id, id));

      if (currentContact) {
        if (currentContact.companyId) {
          await db
            .update(contacts)
            .set({ isPrimary: false, updatedAt: new Date() })
            .where(
              and(
                eq(contacts.companyId, currentContact.companyId),
                sql`${contacts.id} != ${id}`
              )
            );
        }
        if (currentContact.supplierId) {
          await db
            .update(contacts)
            .set({ isPrimary: false, updatedAt: new Date() })
            .where(
              and(
                eq(contacts.supplierId, currentContact.supplierId),
                sql`${contacts.id} != ${id}`
              )
            );
        }
      }
    }

    const [updatedContact] = await db
      .update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();

    if (!updatedContact) {
      throw new Error('Contact not found or update failed');
    }

    return updatedContact;
  }

  async delete(id: string): Promise<void> {
    const { orders, orderItems } = await import("@shared/schema");

    const contactOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.contactId, id));

    const orderIds = contactOrders.map(o => o.id);
    if (orderIds.length > 0) {
      await db.delete(orderItems).where(
        sql`${orderItems.orderId} IN ${sql.raw(`(${orderIds.map(id => `'${id}'`).join(',')})`)}`
      );
    }

    await db.delete(orders).where(eq(orders.contactId, id));
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  async getCompanyName(companyId: string): Promise<string | null> {
    const { companies } = await import("@shared/schema");
    const [company] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, companyId));
    return company?.name || null;
  }

  async getSupplierName(supplierId: string): Promise<string | null> {
    const { suppliers } = await import("@shared/schema");
    const [supplier] = await db.select({ name: suppliers.name }).from(suppliers).where(eq(suppliers.id, supplierId));
    return supplier?.name || null;
  }

  async getAllCompanyNames(): Promise<Map<string, string>> {
    const { companies } = await import("@shared/schema");
    const allCompanies = await db.select({ id: companies.id, name: companies.name }).from(companies);
    return new Map(allCompanies.map(c => [c.id, c.name]));
  }

  async getAllSupplierNames(): Promise<Map<string, string>> {
    const { suppliers } = await import("@shared/schema");
    const allSuppliers = await db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers);
    return new Map(allSuppliers.map(s => [s.id, s.name]));
  }
}

export const contactRepository = new ContactRepository();
