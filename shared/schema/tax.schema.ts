import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tax Codes (CommonSKU-style tax code management)
export const taxCodes = pgTable("tax_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: varchar("label").notNull(), // Internal name (e.g., "NY Sales Tax")
  description: text("description"), // Client-facing description (e.g., "New York State Sales Tax")
  rate: decimal("rate", { precision: 5, scale: 3 }).notNull().default("0"), // Tax rate as % (e.g., 8.875)
  taxjarProductCode: varchar("taxjar_product_code"), // Optional TaxJar product tax code (e.g., "20010" for clothing)
  isExempt: boolean("is_exempt").default(false), // If true, this is a tax-exempt code (no tax calculated)
  isDefault: boolean("is_default").default(false), // Default tax code for new orders
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schema
export const insertTaxCodeSchema = createInsertSchema(taxCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type TaxCode = typeof taxCodes.$inferSelect;
export type InsertTaxCode = z.infer<typeof insertTaxCodeSchema>;
