import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  contacts,
  type Contact,
  type InsertContact,
} from "@shared/schema";

export class ContactRepository {
  async getAll(companyId?: string, supplierId?: string, includeInactive = false): Promise<Contact[]> {
    const activeFilter = includeInactive ? undefined : eq(contacts.isActive, true);

    if (companyId) {
      const conditions = activeFilter
        ? and(eq(contacts.companyId, companyId), activeFilter)
        : eq(contacts.companyId, companyId);
      return await db.select().from(contacts).where(conditions).orderBy(desc(contacts.createdAt));
    }
    if (supplierId) {
      const conditions = activeFilter
        ? and(eq(contacts.supplierId, supplierId), activeFilter)
        : eq(contacts.supplierId, supplierId);
      return await db.select().from(contacts).where(conditions).orderBy(desc(contacts.createdAt));
    }
    if (activeFilter) {
      return await db.select().from(contacts).where(activeFilter).orderBy(desc(contacts.createdAt));
    }
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
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
    // Soft delete — mark as inactive (CommonSKU-style: preserve history)
    await db
      .update(contacts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(contacts.id, id));
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
