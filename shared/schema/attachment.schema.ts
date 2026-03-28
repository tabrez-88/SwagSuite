import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { orders } from "./order.schema";
import { communications } from "./communication.schema";
import { users } from "./user.schema";

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

// Insert schemas
export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;
