import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./user.schema";
import { orders } from "./order.schema";

// Project Timeline Activities
export const projectActivities = pgTable("project_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityType: varchar("activity_type").notNull(), // "status_change", "comment", "file_upload", "mention", "system_action"
  content: text("content").notNull(), // The activity description or message
  metadata: jsonb("metadata"), // Additional data like file names, old/new status, etc.
  mentionedUsers: jsonb("mentioned_users"), // Array of user IDs mentioned in the activity
  isSystemGenerated: boolean("is_system_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications for @ mentions and project updates
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  senderId: varchar("sender_id").references(() => users.id),
  orderId: varchar("order_id").references(() => orders.id),
  activityId: varchar("activity_id").references(() => projectActivities.id),
  type: varchar("type").notNull(), // "mention", "project_update", "status_change"
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertProjectActivitySchema = createInsertSchema(projectActivities).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type ProjectActivity = typeof projectActivities.$inferSelect;
export type InsertProjectActivity = typeof projectActivities.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
