import { eq, desc, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  invoices,
  paymentTransactions,
  orders,
  companies,
  type Invoice,
  type InsertInvoice,
  type PaymentTransaction,
  type InsertPaymentTransaction,
} from "@shared/schema";

export type ArAgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export interface ArAgingInvoice {
  invoiceId: string;
  invoiceNumber: string;
  orderId: string | null;
  orderNumber: string | null;
  projectName: string | null;
  companyId: string | null;
  companyName: string | null;
  totalAmount: number;
  dueDate: string | null;
  status: string;
  daysPastDue: number;
  bucket: ArAgingBucket;
}

export interface ArAgingReport {
  buckets: Record<ArAgingBucket, { count: number; total: number }>;
  totalOutstanding: number;
  totalInvoices: number;
  invoices: ArAgingInvoice[];
}

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

  async getNextInvoiceSequence(orderId: string): Promise<number> {
    const rows = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(eq(invoices.orderId, orderId));
    let max = 0;
    for (const row of rows) {
      const match = /-INV-(\d+)$/.exec(row.invoiceNumber || "");
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > max) max = n;
      }
    }
    return max + 1;
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

  /**
   * AR Aging Report — buckets open invoices (pending/overdue) by days past due.
   * Buckets: current (not yet due), 1-30, 31-60, 61-90, 90+.
   * Invoices with no dueDate are treated as "current".
   */
  async getArAgingReport(): Promise<ArAgingReport> {
    const rows = await db
      .select({
        invoiceId: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        orderId: invoices.orderId,
        orderNumber: orders.orderNumber,
        projectName: orders.projectName,
        companyId: orders.companyId,
        companyName: companies.name,
        totalAmount: invoices.totalAmount,
        dueDate: invoices.dueDate,
        status: invoices.status,
      })
      .from(invoices)
      .leftJoin(orders, eq(invoices.orderId, orders.id))
      .leftJoin(companies, eq(orders.companyId, companies.id))
      .where(inArray(invoices.status, ["pending", "overdue"]));

    const now = new Date();
    const buckets: Record<ArAgingBucket, { count: number; total: number }> = {
      current: { count: 0, total: 0 },
      "1-30": { count: 0, total: 0 },
      "31-60": { count: 0, total: 0 },
      "61-90": { count: 0, total: 0 },
      "90+": { count: 0, total: 0 },
    };

    const bucketFor = (days: number): ArAgingBucket => {
      if (days <= 0) return "current";
      if (days <= 30) return "1-30";
      if (days <= 60) return "31-60";
      if (days <= 90) return "61-90";
      return "90+";
    };

    const enriched: ArAgingInvoice[] = rows.map((r) => {
      const total = parseFloat(r.totalAmount || "0") || 0;
      const due = r.dueDate ? new Date(r.dueDate) : null;
      const daysPastDue = due ? Math.floor((now.getTime() - due.getTime()) / 86_400_000) : 0;
      const bucket = bucketFor(daysPastDue);
      buckets[bucket].count += 1;
      buckets[bucket].total += total;
      return {
        invoiceId: r.invoiceId,
        invoiceNumber: r.invoiceNumber,
        orderId: r.orderId,
        orderNumber: r.orderNumber,
        projectName: r.projectName,
        companyId: r.companyId,
        companyName: r.companyName,
        totalAmount: total,
        dueDate: due ? due.toISOString() : null,
        status: r.status || "pending",
        daysPastDue,
        bucket,
      };
    });

    // Sort: most overdue first, then by total desc
    enriched.sort((a, b) => {
      if (b.daysPastDue !== a.daysPastDue) return b.daysPastDue - a.daysPastDue;
      return b.totalAmount - a.totalAmount;
    });

    const totalOutstanding = enriched.reduce((sum, inv) => sum + inv.totalAmount, 0);

    return {
      buckets,
      totalOutstanding,
      totalInvoices: enriched.length,
      invoices: enriched,
    };
  }
}

export const invoiceRepository = new InvoiceRepository();
