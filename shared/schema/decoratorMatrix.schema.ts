import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { suppliers } from "./supplier.schema";

// Decorator pricing matrices — per-vendor lookup tables for decoration costs
export const decoratorMatrices = pgTable("decorator_matrices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Standard Screen Print Pricing"
  decorationMethod: varchar("decoration_method", { length: 100 }).notNull(), // embroidery, screen-print, etc.
  isDefault: boolean("is_default").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matrix entries — qty breaks with run/setup costs
export const decoratorMatrixEntries = pgTable("decorator_matrix_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matrixId: varchar("matrix_id").notNull().references(() => decoratorMatrices.id, { onDelete: 'cascade' }),
  minQuantity: integer("min_quantity").notNull(),
  maxQuantity: integer("max_quantity"), // null = unlimited
  colorCount: integer("color_count").default(1), // number of colors
  setupCost: decimal("setup_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  runCost: decimal("run_cost", { precision: 10, scale: 2 }).notNull().default("0"), // per unit
  additionalColorCost: decimal("additional_color_cost", { precision: 10, scale: 2 }).default("0"),
  notes: varchar("notes", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertDecoratorMatrixSchema = createInsertSchema(decoratorMatrices).omit({
  id: true, createdAt: true, updatedAt: true,
});

export const insertDecoratorMatrixEntrySchema = createInsertSchema(decoratorMatrixEntries).omit({
  id: true, createdAt: true,
});

// Types
export type DecoratorMatrix = typeof decoratorMatrices.$inferSelect;
export type InsertDecoratorMatrix = z.infer<typeof insertDecoratorMatrixSchema>;
export type DecoratorMatrixEntry = typeof decoratorMatrixEntries.$inferSelect;
export type InsertDecoratorMatrixEntry = z.infer<typeof insertDecoratorMatrixEntrySchema>;
