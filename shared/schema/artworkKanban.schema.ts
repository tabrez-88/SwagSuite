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
import { createInsertSchema } from "drizzle-zod";
import { orders } from "./order.schema";
import { companies } from "./company.schema";
import { users } from "./user.schema";

// Artwork management tables for Kanban-style workflow
export const artworkColumns = pgTable("artwork_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  position: integer("position").notNull(),
  color: varchar("color").notNull().default("#6B7280"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const artworkCards = pgTable("artwork_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  columnId: varchar("column_id").notNull().references(() => artworkColumns.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  assignedUserId: varchar("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  position: integer("position").notNull(),
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  dueDate: timestamp("due_date"),
  labels: jsonb("labels").default(sql`'[]'::jsonb`),
  attachments: jsonb("attachments").default(sql`'[]'::jsonb`),
  checklist: jsonb("checklist").default(sql`'[]'::jsonb`),
  comments: jsonb("comments").default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertArtworkColumnSchema = createInsertSchema(artworkColumns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArtworkCardSchema = createInsertSchema(artworkCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type ArtworkColumn = typeof artworkColumns.$inferSelect;
export type InsertArtworkColumn = typeof artworkColumns.$inferInsert;
export type ArtworkCard = typeof artworkCards.$inferSelect;
export type InsertArtworkCard = typeof artworkCards.$inferInsert;
