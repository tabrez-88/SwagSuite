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
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Suppliers/Vendors
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  website: varchar("website"),
  contactPerson: varchar("contact_person"),
  paymentTerms: varchar("payment_terms"),
  notes: text("notes"),
  isPreferred: boolean("is_preferred").default(false),
  doNotOrder: boolean("do_not_order").default(false),
  // Enhanced vendor management
  ytdSpend: decimal("ytd_spend", { precision: 12, scale: 2 }).default("0"),
  lastYearSpend: decimal("last_year_spend", { precision: 12, scale: 2 }).default("0"),
  productCount: integer("product_count").default(0),
  preferredBenefits: jsonb("preferred_benefits"), // EQP, rebates, self-promos, etc.
  vendorOffers: jsonb("vendor_offers"), // Current offers and programs
  autoNotifications: boolean("auto_notifications").default(true),
  lastOrderDate: timestamp("last_order_date"),
  orderConfirmationReminder: boolean("order_confirmation_reminder").default(true),
  // ESP/ASI/SAGE integration
  espId: varchar("esp_id"),
  asiId: varchar("asi_id"),
  sageId: varchar("sage_id"),
  distributorCentralId: varchar("distributor_central_id"),
  apiIntegrationStatus: varchar("api_integration_status"), // active, inactive, error
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
