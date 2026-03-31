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

// Matrix types: run_charge_table (2D grid), run_charge_per_item (item list),
// fixed_charge_table (label+cost rows), fixed_charge_list (desc+cost+per-unit)
export const MATRIX_TYPES = [
  "run_charge_table",
  "run_charge_per_item",
  "fixed_charge_table",
  "fixed_charge_list",
] as const;
export type MatrixType = (typeof MATRIX_TYPES)[number];

// Decorator pricing matrices — per-vendor lookup tables for decoration costs
export const decoratorMatrices = pgTable("decorator_matrices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Standard Screen Print Pricing"
  decorationMethod: varchar("decoration_method", { length: 100 }).notNull(), // embroidery, screen-print, etc.
  matrixType: varchar("matrix_type", { length: 50 }).notNull().default("run_charge_table"),
  description: text("description"), // internal description
  rowBasis: varchar("row_basis", { length: 100 }), // what rows represent: "colors", "stitches", etc.
  increment: varchar("increment", { length: 100 }), // fixed_charge_list: increment value (e.g., "1")
  units: varchar("units", { length: 100 }), // fixed_charge_list: unit label (e.g., "colors", "stitches")
  isDefault: boolean("is_default").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matrix entries — flexible rows that adapt to matrixType
export const decoratorMatrixEntries = pgTable("decorator_matrix_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matrixId: varchar("matrix_id").notNull().references(() => decoratorMatrices.id, { onDelete: 'cascade' }),
  rowLabel: varchar("row_label", { length: 255 }), // row identifier (item name, variable label, charge desc)
  minQuantity: integer("min_quantity").notNull().default(0),
  maxQuantity: integer("max_quantity"), // null = unlimited
  colorCount: integer("color_count").default(1), // number of colors
  setupCost: decimal("setup_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  runCost: decimal("run_cost", { precision: 10, scale: 2 }).notNull().default("0"), // per unit
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).default("0"), // single cost for non-table types
  additionalColorCost: decimal("additional_color_cost", { precision: 10, scale: 2 }).default("0"),
  perUnit: varchar("per_unit", { length: 100 }), // increment label for fixed_charge_list (e.g. "per color")
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
