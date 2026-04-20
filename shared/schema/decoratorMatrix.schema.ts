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

// Charge type: run vs fixed
export const CHARGE_TYPES = ["run", "fixed"] as const;
export type ChargeType = (typeof CHARGE_TYPES)[number];

// Display type: table, per_item, list
export const DISPLAY_TYPES = ["table", "per_item", "list"] as const;
export type DisplayType = (typeof DISPLAY_TYPES)[number];

// ── Decorator Matrices ──
// One per decoration/charge within a decorator (vendor).
export const decoratorMatrices = pgTable("decorator_matrices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  chargeType: varchar("charge_type", { length: 20 }).notNull().default("run"), // "run" | "fixed"
  displayType: varchar("display_type", { length: 20 }).notNull().default("table"), // "table" | "per_item" | "list"
  description: text("description"),
  rowBasis: varchar("row_basis", { length: 100 }), // what rows represent: "Colors", "Logo", etc.
  increment: varchar("increment", { length: 100 }), // for fixed_charge_list
  units: varchar("units", { length: 100 }), // for fixed_charge_list: "Colors", "Stitches"
  isDefault: boolean("is_default").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Breakdowns (quantity columns for table types) ──
export const decoratorMatrixBreakdowns = pgTable("decorator_matrix_breakdowns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matrixId: varchar("matrix_id").notNull().references(() => decoratorMatrices.id, { onDelete: 'cascade' }),
  minQuantity: integer("min_quantity").notNull().default(0),
  maxQuantity: integer("max_quantity"), // null = "+"
  sortOrder: integer("sort_order").notNull().default(0),
});

// ── Rows (row labels) ──
export const decoratorMatrixRows = pgTable("decorator_matrix_rows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matrixId: varchar("matrix_id").notNull().references(() => decoratorMatrices.id, { onDelete: 'cascade' }),
  rowLabel: varchar("row_label", { length: 255 }).notNull().default(""),
  unitCost: decimal("unit_cost", { precision: 10, scale: 4 }), // for per_item / list types
  perUnit: varchar("per_unit", { length: 100 }), // for list type: "per Colors"
  sortOrder: integer("sort_order").notNull().default(0),
});

// ── Cells (intersection values for table types) ──
export const decoratorMatrixCells = pgTable("decorator_matrix_cells", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matrixId: varchar("matrix_id").notNull().references(() => decoratorMatrices.id, { onDelete: 'cascade' }),
  rowId: varchar("row_id").notNull().references(() => decoratorMatrixRows.id, { onDelete: 'cascade' }),
  breakdownId: varchar("breakdown_id").notNull().references(() => decoratorMatrixBreakdowns.id, { onDelete: 'cascade' }),
  price: decimal("price", { precision: 10, scale: 4 }).notNull().default("0"),
});

// ── Insert Schemas ──
export const insertDecoratorMatrixSchema = createInsertSchema(decoratorMatrices).omit({
  id: true, createdAt: true, updatedAt: true,
});

export const insertDecoratorMatrixBreakdownSchema = createInsertSchema(decoratorMatrixBreakdowns).omit({
  id: true,
});

export const insertDecoratorMatrixRowSchema = createInsertSchema(decoratorMatrixRows).omit({
  id: true,
});

export const insertDecoratorMatrixCellSchema = createInsertSchema(decoratorMatrixCells).omit({
  id: true,
});

// ── Types ──
export type DecoratorMatrix = typeof decoratorMatrices.$inferSelect;
export type InsertDecoratorMatrix = z.infer<typeof insertDecoratorMatrixSchema>;
export type DecoratorMatrixBreakdown = typeof decoratorMatrixBreakdowns.$inferSelect;
export type InsertDecoratorMatrixBreakdown = z.infer<typeof insertDecoratorMatrixBreakdownSchema>;
export type DecoratorMatrixRow = typeof decoratorMatrixRows.$inferSelect;
export type InsertDecoratorMatrixRow = z.infer<typeof insertDecoratorMatrixRowSchema>;
export type DecoratorMatrixCell = typeof decoratorMatrixCells.$inferSelect;
export type InsertDecoratorMatrixCell = z.infer<typeof insertDecoratorMatrixCellSchema>;

// Convenience type: full matrix with all nested data
export interface DecoratorMatrixFull extends DecoratorMatrix {
  breakdowns: DecoratorMatrixBreakdown[];
  rows: DecoratorMatrixRow[];
  cells: DecoratorMatrixCell[];
}
