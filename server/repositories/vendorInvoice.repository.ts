import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  vendorInvoices,
  type VendorInvoice,
  type InsertVendorInvoice,
} from "@shared/schema";

export class VendorInvoiceRepository {
  async createVendorInvoice(
    invoice: InsertVendorInvoice
  ): Promise<VendorInvoice> {
    const [newInvoice] = await db
      .insert(vendorInvoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getVendorInvoices(
    supplierId?: string,
    status?: string
  ): Promise<VendorInvoice[]> {
    const query = db.select().from(vendorInvoices);

    if (supplierId && status) {
      return await query
        .where(
          and(
            eq(vendorInvoices.supplierId, supplierId),
            eq(vendorInvoices.status, status)
          )
        )
        .orderBy(desc(vendorInvoices.createdAt));
    } else if (supplierId) {
      return await query
        .where(eq(vendorInvoices.supplierId, supplierId))
        .orderBy(desc(vendorInvoices.createdAt));
    } else if (status) {
      return await query
        .where(eq(vendorInvoices.status, status))
        .orderBy(desc(vendorInvoices.createdAt));
    }

    return await query.orderBy(desc(vendorInvoices.createdAt));
  }

  async updateVendorInvoice(
    id: string,
    invoice: Partial<InsertVendorInvoice>
  ): Promise<VendorInvoice> {
    const [updatedInvoice] = await db
      .update(vendorInvoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(vendorInvoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async getVendorInvoice(id: string): Promise<VendorInvoice | undefined> {
    const [invoice] = await db
      .select()
      .from(vendorInvoices)
      .where(eq(vendorInvoices.id, id));
    return invoice;
  }

  async getVendorInvoicesByOrderId(
    orderId: string
  ): Promise<VendorInvoice[]> {
    return await db
      .select()
      .from(vendorInvoices)
      .where(eq(vendorInvoices.orderId, orderId))
      .orderBy(desc(vendorInvoices.createdAt));
  }
}

export const vendorInvoiceRepository = new VendorInvoiceRepository();
