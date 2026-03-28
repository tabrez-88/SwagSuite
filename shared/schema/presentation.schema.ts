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
import { products } from "./product.schema";

// AI Presentation Builder tables
export const presentations = pgTable("presentations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  dealNotes: text("deal_notes"),
  hubspotDealId: varchar("hubspot_deal_id"),
  suggestedProducts: jsonb("suggested_products").default(sql`'[]'::jsonb`),
  slides: jsonb("slides").default(sql`'[]'::jsonb`),
  status: varchar("status").default("draft"), // draft, generating, completed
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const presentationFiles = pgTable("presentation_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  presentationId: varchar("presentation_id").notNull().references(() => presentations.id, { onDelete: "cascade" }),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size"),
  filePath: varchar("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const presentationProducts = pgTable("presentation_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  presentationId: varchar("presentation_id").notNull().references(() => presentations.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id),
  productName: varchar("product_name").notNull(),
  suggestedPrice: decimal("suggested_price", { precision: 10, scale: 2 }),
  suggestedQuantity: integer("suggested_quantity"),
  reasoning: text("reasoning"),
  isIncluded: boolean("is_included").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export type Presentation = typeof presentations.$inferSelect;
export type InsertPresentation = typeof presentations.$inferInsert;
export type PresentationFile = typeof presentationFiles.$inferSelect;
export type InsertPresentationFile = typeof presentationFiles.$inferInsert;
export type PresentationProduct = typeof presentationProducts.$inferSelect;
export type InsertPresentationProduct = typeof presentationProducts.$inferInsert;
