import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";

// S&S Activewear Integration
export const ssActivewearProducts = pgTable("ss_activewear_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: varchar("sku").notNull().unique(),
  gtin: varchar("gtin"),
  styleId: integer("style_id"),
  brandName: varchar("brand_name"),
  styleName: varchar("style_name"),
  colorName: varchar("color_name"),
  colorCode: varchar("color_code"),
  sizeName: varchar("size_name"),
  sizeCode: varchar("size_code"),
  unitWeight: decimal("unit_weight", { precision: 10, scale: 4 }),
  caseQty: integer("case_qty"),
  piecePrice: decimal("piece_price", { precision: 10, scale: 2 }),
  dozenPrice: decimal("dozen_price", { precision: 10, scale: 2 }),
  casePrice: decimal("case_price", { precision: 10, scale: 2 }),
  customerPrice: decimal("customer_price", { precision: 10, scale: 2 }),
  qty: integer("qty").default(0),
  colorFrontImage: varchar("color_front_image"),
  colorBackImage: varchar("color_back_image"),
  colorSideImage: varchar("color_side_image"),
  colorSwatchImage: varchar("color_swatch_image"),
  countryOfOrigin: varchar("country_of_origin"),
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ssActivewearImportJobs = pgTable("ss_activewear_import_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, running, completed, failed
  totalProducts: integer("total_products").default(0),
  processedProducts: integer("processed_products").default(0),
  newProducts: integer("new_products").default(0),
  updatedProducts: integer("updated_products").default(0),
  errorCount: integer("error_count").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export type SsActivewearProduct = typeof ssActivewearProducts.$inferSelect;
export type InsertSsActivewearProduct = typeof ssActivewearProducts.$inferInsert;
export type SsActivewearImportJob = typeof ssActivewearImportJobs.$inferSelect;
export type InsertSsActivewearImportJob = typeof ssActivewearImportJobs.$inferInsert;
