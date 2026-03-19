import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import {
  invoices,
  paymentTransactions,
  type Invoice,
  type InsertInvoice,
  type PaymentTransaction,
  type InsertPaymentTransaction,
} from "@shared/schema";

export class InvoiceRepository {
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceByOrderId(orderId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.orderId, orderId));
    return invoice;
  }

  async getInvoiceByStripeInvoiceId(stripeInvoiceId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.stripeInvoiceId, stripeInvoiceId));
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice;
  }

  async getInvoices(status?: string): Promise<Invoice[]> {
    if (status) {
      return await db.select().from(invoices).where(eq(invoices.status, status));
    }
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updated] = await db.update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [newTransaction] = await db.insert(paymentTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getPaymentTransactionsByInvoiceId(invoiceId: string): Promise<PaymentTransaction[]> {
    return await db.select().from(paymentTransactions)
      .where(eq(paymentTransactions.invoiceId, invoiceId))
      .orderBy(desc(paymentTransactions.createdAt));
  }
}

export const invoiceRepository = new InvoiceRepository();
