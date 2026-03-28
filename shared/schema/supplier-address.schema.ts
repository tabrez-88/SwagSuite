import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { suppliers } from "./supplier.schema";

// Supplier Addresses (CommonSKU-style: separate entity per supplier)
export const supplierAddresses = pgTable("supplier_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  addressName: varchar("address_name"), // Internal label (e.g., "Main Warehouse", "East Coast")
  companyNameOnDocs: varchar("company_name_on_docs"), // Override supplier name on external documents (POs, etc.)
  street: text("street"),
  street2: text("street2"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  country: varchar("country").default("US"),
  addressType: varchar("address_type").notNull().default("both"), // 'billing' | 'shipping' | 'both'
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertSupplierAddressSchema = createInsertSchema(supplierAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type SupplierAddress = typeof supplierAddresses.$inferSelect;
export type InsertSupplierAddress = z.infer<typeof insertSupplierAddressSchema>;
