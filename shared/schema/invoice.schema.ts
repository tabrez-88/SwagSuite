import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { orders } from "./order.schema";

// Customer Invoices (Sales Invoices for Orders)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status").default("pending"), // pending, paid, overdue, cancelled
  dueDate: timestamp("due_date"),
  qbInvoiceId: varchar("qb_invoice_id"), // QuickBooks Invoice ID
  qbSyncedAt: timestamp("qb_synced_at"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  stripeInvoiceUrl: text("stripe_invoice_url"),
  stripeInvoicePdfUrl: text("stripe_invoice_pdf_url"),
  paymentMethod: varchar("payment_method"), // stripe, manual_card, check, wire, credit
  paymentReference: varchar("payment_reference"), // Check #, Wire #, etc.
  notes: text("notes"),
  sentAt: timestamp("sent_at"),
  reminderEnabled: boolean("reminder_enabled").notNull().default(false),
  reminderFrequencyDays: integer("reminder_frequency_days"),
  nextReminderDate: timestamp("next_reminder_date"),
  lastReminderSentAt: timestamp("last_reminder_sent_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Transactions
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(), // stripe, manual_card, check, wire, credit
  paymentReference: varchar("payment_reference"), // Stripe charge ID, check number, etc.
  status: varchar("status").default("pending"), // pending, completed, failed, refunded
  metadata: jsonb("metadata"), // Store Stripe metadata, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;
