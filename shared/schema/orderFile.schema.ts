import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
} from "drizzle-orm/pg-core";
import { orders, orderItems } from "./order.schema";
import { users } from "./user.schema";

// Order files (artwork proofs, documents, etc.)
export const orderFiles = pgTable("order_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  orderItemId: varchar("order_item_id").references(() => orderItems.id), // Optional: associate file with specific product
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  filePath: varchar("file_path").notNull(),
  thumbnailPath: varchar("thumbnail_path"),
  fileType: varchar("file_type").notNull().default("document"), // customer_proof, supplier_proof, invoice, other_document, artwork
  tags: jsonb("tags").default(sql`'[]'::jsonb`), // Array of tags like ["customer_proof", "final_artwork"]
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
