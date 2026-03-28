import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { orders, orderItems } from "./order.schema";
import { users } from "./user.schema";
import { suppliers } from "./supplier.schema";
import { artworkFiles, artworkItems } from "./artwork.schema";

// Generated Documents table
export const generatedDocuments = pgTable("generated_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  documentType: varchar("document_type").notNull(), // 'quote', 'purchase_order', 'invoice'
  documentNumber: varchar("document_number").notNull(),
  vendorId: varchar("vendor_id").references(() => suppliers.id), // For POs
  vendorName: varchar("vendor_name"), // Cached vendor name
  fileUrl: text("file_url"), // Cloudinary URL
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"), // In bytes
  status: varchar("status").default("draft"), // draft, sent, approved (quote only), paid (invoice only), cancelled
  generatedBy: varchar("generated_by").references(() => users.id),
  sentAt: timestamp("sent_at"),
  metadata: jsonb("metadata"), // Additional data like items snapshot, totals, etc
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quote approvals - for customer approval of quotes/sales orders
export const quoteApprovals = pgTable("quote_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  documentId: varchar("document_id"), // Reference to generated document
  approvalToken: varchar("approval_token", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, declined
  clientEmail: varchar("client_email", { length: 255 }),
  clientName: varchar("client_name", { length: 255 }),
  quoteTotal: decimal("quote_total", { precision: 12, scale: 2 }),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"), // When client first viewed the quote
  approvedAt: timestamp("approved_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  approvalNotes: text("approval_notes"), // Client can add notes when approving
  pdfPath: varchar("pdf_path", { length: 500 }),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PO confirmations - for vendor confirmation of purchase orders
export const poConfirmations = pgTable("po_confirmations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  documentId: varchar("document_id"), // Reference to generated PO document
  confirmationToken: varchar("confirmation_token", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, confirmed, declined
  vendorEmail: varchar("vendor_email", { length: 255 }),
  vendorName: varchar("vendor_name", { length: 255 }),
  vendorId: varchar("vendor_id").references(() => suppliers.id),
  poTotal: decimal("po_total", { precision: 12, scale: 2 }),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  confirmedAt: timestamp("confirmed_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  confirmationNotes: text("confirmation_notes"),
  pdfPath: varchar("pdf_path", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertGeneratedDocumentSchema = createInsertSchema(generatedDocuments);

// Types
export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type InsertGeneratedDocument = z.infer<typeof insertGeneratedDocumentSchema>;
