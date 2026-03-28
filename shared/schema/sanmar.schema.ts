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

// Unified product search index for cross-platform searching (SanMar search cache)
export const productSearchIndex = pgTable("product_search_index", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceSystem: varchar("source_system").notNull(), // 'esp', 'sage', 'dc', 'internal'
  sourceProductId: varchar("source_product_id").notNull(),
  productName: varchar("product_name").notNull(),
  category: varchar("category"),
  subcategory: varchar("subcategory"),
  supplierId: varchar("supplier_id"),
  supplierName: varchar("supplier_name"),
  asiNumber: varchar("asi_number"),
  description: text("description"),
  keyTerms: text("key_terms").array(),
  minPrice: decimal("min_price"),
  maxPrice: decimal("max_price"),
  minQuantity: integer("min_quantity"),
  decorationMethods: text("decoration_methods").array(),
  colors: text("colors").array(),
  primaryImage: varchar("primary_image"),
  qualityScore: decimal("quality_score"),
  popularityScore: integer("popularity_score").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  searchRank: integer("search_rank").default(0),
  isActive: boolean("is_active").default(true),
});

// Types
export type ProductSearchResult = typeof productSearchIndex.$inferSelect;
