import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { suppliers } from "./supplier.schema";
import { products } from "./product.schema";
import { orders } from "./order.schema";
import { users } from "./user.schema";

// Vendor Approval Requests (for Do Not Order vendors)
export const vendorApprovalRequests = pgTable("vendor_approval_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  productId: varchar("product_id").references(() => products.id),
  orderId: varchar("order_id").references(() => orders.id),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  reason: text("reason"), // Why the salesperson wants to use this vendor
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertVendorApprovalRequestSchema = createInsertSchema(vendorApprovalRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
});

// Types
export type VendorApprovalRequest = typeof vendorApprovalRequests.$inferSelect;
export type InsertVendorApprovalRequest = z.infer<typeof insertVendorApprovalRequestSchema>;
