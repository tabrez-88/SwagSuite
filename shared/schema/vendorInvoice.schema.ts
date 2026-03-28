import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
} from "drizzle-orm/pg-core";
import { suppliers } from "./supplier.schema";
import { orders } from "./order.schema";

// Vendor Invoices (Vouching Process)
export const vendorInvoices = pgTable("vendor_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  orderId: varchar("order_id").references(() => orders.id), // The PO this is vouching against
  documentId: varchar("document_id"), // Link to PO document (generatedDocuments.id) for vouching
  invoiceNumber: varchar("invoice_number").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status").default("pending"), // pending, vouched, paid, rejection
  qbBillId: varchar("qb_bill_id"), // Map to QuickBooks Bill
  receivedDate: timestamp("received_date").defaultNow(),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type VendorInvoice = typeof vendorInvoices.$inferSelect;
export type InsertVendorInvoice = typeof vendorInvoices.$inferInsert;
