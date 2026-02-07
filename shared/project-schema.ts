import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { users, orders } from "./schema";

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

// Relations for project activities
export const projectActivitiesRelations = relations(projectActivities, ({ one }) => ({
  order: one(orders, {
    fields: [projectActivities.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [projectActivities.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [notifications.orderId],
    references: [orders.id],
  }),
  activity: one(projectActivities, {
    fields: [notifications.activityId],
    references: [projectActivities.id],
  }),
}));

// Project Activity Types
export type ProjectActivity = typeof projectActivities.$inferSelect;
export type InsertProjectActivity = typeof projectActivities.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Project Activity Schema Validation
export const insertProjectActivitySchema = createInsertSchema(projectActivities).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Communications table for tracking emails sent to clients and vendors
export const communications = pgTable("communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  communicationType: varchar("communication_type").notNull(), // "client_email", "vendor_email"
  direction: varchar("direction").notNull(), // "sent", "received"
  recipientEmail: varchar("recipient_email").notNull(),
  recipientName: varchar("recipient_name"),
  subject: varchar("subject").notNull(),
  body: text("body").notNull(),
  metadata: jsonb("metadata"), // Additional data like attachments, template used, etc.
  sentAt: timestamp("sent_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communicationsRelations = relations(communications, ({ one }) => ({
  order: one(orders, {
    fields: [communications.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [communications.userId],
    references: [users.id],
  }),
}));

export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = typeof communications.$inferInsert;

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

// Attachments table for file storage
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  communicationId: varchar("communication_id").references(() => communications.id, { onDelete: "cascade" }),
  filename: varchar("filename").notNull(),
  originalFilename: varchar("original_filename").notNull(),
  storagePath: varchar("storage_path").notNull(),
  mimeType: varchar("mime_type"),
  fileSize: integer("file_size"),
  category: varchar("category").default("attachment"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  order: one(orders, {
    fields: [attachments.orderId],
    references: [orders.id],
  }),
  communication: one(communications, {
    fields: [attachments.communicationId],
    references: [communications.id],
  }),
  user: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}));

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
