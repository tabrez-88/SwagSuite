import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { orders, orderItems } from "./order.schema";
import { companies } from "./company.schema";
import { users } from "./user.schema";

// ── Centralized Media Library ──
export const mediaLibrary = pgTable("media_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cloudinaryPublicId: varchar("cloudinary_public_id"),
  cloudinaryUrl: varchar("cloudinary_url").notNull(),
  cloudinaryResourceType: varchar("cloudinary_resource_type"),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  fileExtension: varchar("file_extension"),
  thumbnailUrl: varchar("thumbnail_url"),
  folder: varchar("folder").default("general"),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  category: varchar("category"),
  orderId: varchar("order_id").references(() => orders.id),
  companyId: varchar("company_id").references(() => companies.id),
  orderItemId: varchar("order_item_id").references(() => orderItems.id),
  sourceTable: varchar("source_table"),
  sourceId: varchar("source_id"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_media_library_folder").on(table.folder),
  index("idx_media_library_category").on(table.category),
  index("idx_media_library_company").on(table.companyId),
  index("idx_media_library_order").on(table.orderId),
  index("idx_media_library_uploaded_by").on(table.uploadedBy),
  index("idx_media_library_created_at").on(table.createdAt),
]);

// Insert schemas
export const insertMediaLibrarySchema = createInsertSchema(mediaLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type MediaLibraryItem = typeof mediaLibrary.$inferSelect;
export type InsertMediaLibraryItem = z.infer<typeof insertMediaLibrarySchema>;
