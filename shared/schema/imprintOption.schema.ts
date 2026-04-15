import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./user.schema";

// Canonical imprint option values (shared across all tenants).
// `type` distinguishes location vs method.
export const imprintOptions = pgTable(
  "imprint_options",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    type: varchar("type").notNull(), // 'location' | 'method'
    value: varchar("value").notNull(), // snake_case stored value (e.g. "left_chest")
    label: varchar("label").notNull(), // human-facing (e.g. "Left Chest")
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isBuiltIn: boolean("is_built_in").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    typeValueUnique: uniqueIndex("imprint_options_type_value_unique").on(table.type, table.value),
  }),
);

// User-submitted suggestions awaiting admin review.
export const imprintOptionSuggestions = pgTable("imprint_option_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'location' | 'method'
  label: varchar("label").notNull(), // raw user input
  normalizedLabel: varchar("normalized_label").notNull(), // lowercased/trimmed for dedup
  suggestedBy: varchar("suggested_by").references(() => users.id, { onDelete: "set null" }),
  suggestedFromOrderId: varchar("suggested_from_order_id"),
  status: varchar("status").default("pending").notNull(), // 'pending' | 'approved' | 'rejected'
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  approvedOptionId: varchar("approved_option_id").references(() => imprintOptions.id, {
    onDelete: "set null",
  }),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const IMPRINT_OPTION_TYPES = ["location", "method"] as const;
export type ImprintOptionType = (typeof IMPRINT_OPTION_TYPES)[number];

export const insertImprintOptionSchema = createInsertSchema(imprintOptions, {
  type: z.enum(IMPRINT_OPTION_TYPES),
  value: z.string().min(1),
  label: z.string().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertImprintOptionSuggestionSchema = createInsertSchema(imprintOptionSuggestions, {
  type: z.enum(IMPRINT_OPTION_TYPES),
  label: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  normalizedLabel: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  approvedOptionId: true,
});

export type ImprintOption = typeof imprintOptions.$inferSelect;
export type InsertImprintOption = z.infer<typeof insertImprintOptionSchema>;
export type ImprintOptionSuggestion = typeof imprintOptionSuggestions.$inferSelect;
export type InsertImprintOptionSuggestion = z.infer<typeof insertImprintOptionSuggestionSchema>;
