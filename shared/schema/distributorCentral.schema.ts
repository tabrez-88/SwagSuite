import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
} from "drizzle-orm/pg-core";
import { suppliers } from "./supplier.schema";

// Distributor Central Products Integration
export const distributorCentralProducts = pgTable("distributor_central_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dcProductId: varchar("dc_product_id").notNull().unique(),
  productName: varchar("product_name").notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  category: varchar("category"),
  subcategory: varchar("subcategory"),
  description: text("description"),
  keyFeatures: text("key_features").array(),
  decorationAreas: jsonb("decoration_areas"),
  imprintMethods: text("imprint_methods").array(),
  colors: text("available_colors").array(),
  sizes: text("available_sizes").array(),
  pricing: jsonb("pricing"),
  quantityPricing: jsonb("quantity_pricing"),
  minimumOrder: integer("minimum_order"),
  rushOptions: jsonb("rush_options"),
  productImages: text("product_images").array(),
  compliance: text("compliance").array(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  syncStatus: varchar("sync_status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type DistributorCentralProduct = typeof distributorCentralProducts.$inferSelect;
