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
import { orders } from "./order.schema";

// Production stages table for customizable workflow stages
export const productionStages = pgTable("production_stages", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: varchar("description"),
  order: integer("order").notNull(),
  color: varchar("color").notNull().default("bg-gray-100 text-gray-800"),
  icon: varchar("icon").notNull().default("Package"),
  isActive: boolean("is_active").default(true),
  // Stage flags — mark what "role" each stage plays in PO lifecycle
  isInitial: boolean("is_initial").default(false),
  isFinal: boolean("is_final").default(false),
  onEmailSent: boolean("on_email_sent").default(false),
  onVendorConfirm: boolean("on_vendor_confirm").default(false),
  onBilling: boolean("on_billing").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Production tracking table for orders in production
export const productionTracking = pgTable("production_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  currentStageId: varchar("current_stage_id").references(() => productionStages.id),
  assignedTo: varchar("assigned_to"),
  nextActionDate: timestamp("next_action_date"),
  nextActionNotes: text("next_action_notes"),
  completedStages: jsonb("completed_stages").default(sql`'[]'::jsonb`),
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Production notifications for daily reminders
export const productionNotifications = pgTable("production_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingId: varchar("tracking_id").notNull().references(() => productionTracking.id, { onDelete: "cascade" }),
  assignedTo: varchar("assigned_to").notNull(),
  notificationDate: timestamp("notification_date").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  isSent: boolean("is_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Next action types table for customizable PO follow-up actions
export const nextActionTypes = pgTable("next_action_types", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: varchar("description"),
  order: integer("order").notNull(),
  color: varchar("color").notNull().default("bg-gray-100 text-gray-800"),
  icon: varchar("icon").notNull().default("ClipboardList"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type ProductionStage = typeof productionStages.$inferSelect;
export type InsertProductionStage = typeof productionStages.$inferInsert;
export type NextActionType = typeof nextActionTypes.$inferSelect;
export type InsertNextActionType = typeof nextActionTypes.$inferInsert;
export type ProductionTracking = typeof productionTracking.$inferSelect;
export type InsertProductionTracking = typeof productionTracking.$inferInsert;
export type ProductionNotification = typeof productionNotifications.$inferSelect;
export type InsertProductionNotification = typeof productionNotifications.$inferInsert;
