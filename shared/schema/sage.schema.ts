import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
} from "drizzle-orm/pg-core";
import { suppliers } from "./supplier.schema";

// SAGE Products Integration
export const sageProducts = pgTable("sage_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sageId: varchar("sage_id").notNull().unique(),
  productName: varchar("product_name").notNull(),
  productNumber: varchar("product_number"),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  category: varchar("category"),
  subcategory: varchar("subcategory"),
  brand: varchar("brand"),
  description: text("description"),
  features: text("features").array(),
  materials: text("materials").array(),
  dimensions: varchar("dimensions"),
  weight: decimal("weight", { precision: 10, scale: 4 }),
  eqpLevel: varchar("eqp_level"), // SAGE EQP rating
  pricingStructure: jsonb("pricing_structure"),
  quantityBreaks: jsonb("quantity_breaks"),
  setupCharges: jsonb("setup_charges"),
  decorationMethods: text("decoration_methods").array(),
  leadTimes: jsonb("lead_times"),
  imageGallery: text("image_gallery").array(),
  technicalDrawings: text("technical_drawings").array(),
  complianceCertifications: text("compliance_certifications").array(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  syncStatus: varchar("sync_status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type SageProduct = typeof sageProducts.$inferSelect;
export type InsertSageProduct = typeof sageProducts.$inferInsert;
