import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { suppliers } from "./supplier.schema";

// Product categories
export const productCategories = pgTable("product_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  categoryId: varchar("category_id").references(() => productCategories.id),
  name: varchar("name").notNull(),
  description: text("description"),
  sku: varchar("sku"),
  supplierSku: varchar("supplier_sku"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  minimumQuantity: integer("minimum_quantity").default(1),
  brand: varchar("brand"),
  category: varchar("category"),
  colors: text("colors").array(), // Array of available colors
  sizes: text("sizes").array(), // Array of available sizes
  imprintMethods: text("imprint_methods"), // JSON array
  leadTime: integer("lead_time"), // days
  imageUrl: varchar("image_url"),
  productType: varchar("product_type").default("apparel"), // apparel, hard_goods, promotional
  pricingTiers: jsonb("pricing_tiers"), // Supplier quantity break pricing: [{ quantity: 24, cost: 44.82 }, ...]
  sizeSurcharges: jsonb("size_surcharges"), // Per-size cost adjustments: [{ size: "2XL", surcharge: 2.00 }, { size: "3XL", surcharge: 3.00 }]
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
