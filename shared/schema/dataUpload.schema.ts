import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./user.schema";

// Data Upload/Import storage
export const dataUploads = pgTable("data_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  filePath: varchar("file_path").notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  processedData: jsonb("processed_data"), // AI-analyzed data
  createdRecords: jsonb("created_records"), // IDs of created clients/orders
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Insert schemas
export const insertDataUploadSchema = createInsertSchema(dataUploads).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

// Types
export type DataUpload = typeof dataUploads.$inferSelect;
export type InsertDataUpload = z.infer<typeof insertDataUploadSchema>;
