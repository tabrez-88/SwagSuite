import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { orders } from "./order.schema";

// ── Customer Portal Tokens ──
export const customerPortalTokens = pgTable("customer_portal_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  clientEmail: varchar("client_email"),
  clientName: varchar("client_name"),
  isActive: boolean("is_active").default(true),
  accessCount: integer("access_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  tokenType: varchar("token_type").default("order_tracking"), // order_tracking, presentation
});

// Insert schemas
export const insertCustomerPortalTokenSchema = createInsertSchema(customerPortalTokens);

// Types
export type CustomerPortalToken = typeof customerPortalTokens.$inferSelect;
export type InsertCustomerPortalToken = z.infer<typeof insertCustomerPortalTokenSchema>;
