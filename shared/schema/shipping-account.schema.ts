import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./company.schema";

// ── Shipping Accounts (org-level or per-client) ──
export const shippingAccounts = pgTable("shipping_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerType: varchar("owner_type").notNull().default("organization"), // "organization" | "company"
  ownerId: varchar("owner_id").references(() => companies.id), // null = org-level, companyId = client-level
  accountName: varchar("account_name").notNull(),
  courier: varchar("courier").notNull(), // "ups" | "fedex" | "usps" | "dhl" | "other"
  accountNumber: varchar("account_number").notNull(),
  billingZip: varchar("billing_zip"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schema
export const insertShippingAccountSchema = createInsertSchema(shippingAccounts);

// Types
export type ShippingAccount = typeof shippingAccounts.$inferSelect;
export type InsertShippingAccount = z.infer<typeof insertShippingAccountSchema>;
