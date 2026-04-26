import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Shipping Methods (configurable, CommonSKU-style) ──
export const shippingMethods = pgTable("shipping_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "Ground", "2-Day Air", "Next Day Air"
  courier: varchar("courier").notNull(), // "ups" | "fedex" | "usps" | "dhl" | "other" — determines which accounts appear
  sortOrder: integer("sort_order").default(0), // topmost = default for POs
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schema
export const insertShippingMethodSchema = createInsertSchema(shippingMethods);

// Types
export type ShippingMethod = typeof shippingMethods.$inferSelect;
export type InsertShippingMethod = z.infer<typeof insertShippingMethodSchema>;
