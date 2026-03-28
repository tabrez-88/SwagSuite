import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { orders } from "./order.schema";
import { users } from "./user.schema";

// Error types and resolution enums
export const errorTypeEnum = pgEnum("error_type", [
  "pricing",
  "in_hands_date",
  "shipping",
  "printing",
  "artwork_proofing",
  "oos", // out of stock
  "other"
]);

export const responsiblePartyEnum = pgEnum("responsible_party", [
  "customer",
  "vendor",
  "lsd" // Liquid Screen Design
]);

export const resolutionTypeEnum = pgEnum("resolution_type", [
  "refund",
  "credit_for_future_order",
  "reprint",
  "courier_shipping",
  "other"
]);

// Errors tracking table
export const errors = pgTable("errors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  date: timestamp("date").notNull().defaultNow(),
  projectNumber: varchar("project_number"), // Could be different from order number
  errorType: errorTypeEnum("error_type").notNull(),
  clientName: varchar("client_name").notNull(),
  vendorName: varchar("vendor_name"),
  responsibleParty: responsiblePartyEnum("responsible_party").notNull(),
  resolution: resolutionTypeEnum("resolution").notNull(),
  costToLsd: decimal("cost_to_lsd", { precision: 12, scale: 2 }).default("0"),
  productionRep: varchar("production_rep"),
  orderRep: varchar("order_rep"),
  clientRep: varchar("client_rep"),
  additionalNotes: text("additional_notes"),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertErrorSchema = createInsertSchema(errors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

// Types
export type Error = typeof errors.$inferSelect;
export type InsertError = z.infer<typeof insertErrorSchema>;
