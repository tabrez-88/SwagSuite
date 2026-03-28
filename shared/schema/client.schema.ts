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

// Dedicated clients table for CRM
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  title: varchar("title"),
  industry: varchar("industry"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  website: varchar("website"),
  preferredContact: varchar("preferred_contact").notNull(),
  clientType: varchar("client_type").notNull(),
  status: varchar("status").notNull().default("active"),
  notes: text("notes"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),
  lastOrderDate: timestamp("last_order_date"),
  accountManager: varchar("account_manager"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  paymentTerms: varchar("payment_terms"),
  // Social media integration
  socialMediaLinks: jsonb("social_media_links"),
  socialMediaPosts: jsonb("social_media_posts"),
  lastSocialMediaSync: timestamp("last_social_media_sync"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  totalOrders: true,
  totalSpent: true,
  lastOrderDate: true,
  lastSocialMediaSync: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
