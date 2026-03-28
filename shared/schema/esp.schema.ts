import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { suppliers } from "./supplier.schema";

// ESP/ASI Promotional Products Integration
export const espProducts = pgTable("esp_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  asiNumber: varchar("asi_number").notNull(),
  productName: varchar("product_name").notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  supplierAsiNumber: varchar("supplier_asi_number"),
  category: varchar("category"),
  subCategory: varchar("sub_category"),
  description: text("description"),
  longDescription: text("long_description"),
  specifications: jsonb("specifications"),
  pricingCode: varchar("pricing_code"), // ESP pricing codes
  basePricing: jsonb("base_pricing"),
  decorationPricing: jsonb("decoration_pricing"),
  minimumQuantity: integer("minimum_quantity"),
  productionTime: varchar("production_time"),
  rushService: boolean("rush_service").default(false),
  decorationMethods: text("decoration_methods").array(),
  colors: text("colors").array(),
  sizes: text("sizes").array(),
  imageUrls: text("image_urls").array(),
  espProductId: varchar("esp_product_id").unique(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  syncStatus: varchar("sync_status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type EspProduct = typeof espProducts.$inferSelect;
