import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { orders } from "./order.schema";
import { productionStages } from "./production.schema";
import { generatedDocuments } from "./document.schema";

// ── Purchase Orders (first-class PO entity) ──
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  poNumber: varchar("po_number").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  vendorRole: varchar("vendor_role").notNull().default("supplier"), // "supplier" | "decorator"
  groupKey: varchar("group_key").notNull(),
  currentStageId: varchar("current_stage_id").references(() => productionStages.id),
  documentId: varchar("document_id").references(() => generatedDocuments.id),
  // Vendor confirmation
  confirmationToken: varchar("confirmation_token"),
  confirmationTokenExpiresAt: timestamp("confirmation_token_expires_at"),
  // Lifecycle timestamps
  submittedAt: timestamp("submitted_at"),
  confirmedAt: timestamp("confirmed_at"),
  shippedAt: timestamp("shipped_at"),
  billedAt: timestamp("billed_at"),
  closedAt: timestamp("closed_at"),
  // Notes
  vendorNotes: text("vendor_notes"),
  internalNotes: text("internal_notes"),
  // Shipping snapshot
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Purchase Order Items (junction) ──
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseOrderId: varchar("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  orderItemId: varchar("order_item_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders);
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems);

// Types
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
