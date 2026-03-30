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
import { orderItems } from "./order.schema";
import { orders } from "./order.schema";
import { companies } from "./company.schema";
import { users } from "./user.schema";

// Artwork items per order item
export const artworkItems = pgTable("artwork_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderItemId: varchar("order_item_id").references(() => orderItems.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  artworkType: varchar("artwork_type", { length: 100 }), // embroidery, screen-print, heat-transfer, etc.
  location: varchar("location", { length: 255 }), // e.g., "Front - Centered"
  color: varchar("color", { length: 100 }), // e.g., "White", "PMS 186"
  size: varchar("size", { length: 100 }), // e.g., "3\" x 3\""
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, awaiting_proof, proof_received, pending_approval, approved, change_requested, proofing_complete
  fileName: varchar("file_name", { length: 500 }),
  filePath: varchar("file_path", { length: 500 }),
  proofRequired: boolean("proof_required").default(true), // Whether this decoration requires a proof
  proofFilePath: varchar("proof_file_path", { length: 500 }), // Vendor proof file URL
  proofFileName: varchar("proof_file_name", { length: 500 }), // Vendor proof file name
  repeatLogo: boolean("repeat_logo").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Artwork charges (per-artwork imprint costs & setup costs — CommonSKU style)
export const artworkCharges = pgTable("artwork_charges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artworkItemId: varchar("artwork_item_id").notNull().references(() => artworkItems.id, { onDelete: 'cascade' }),
  chargeName: varchar("charge_name", { length: 255 }).notNull(), // e.g., "Imprint Charge", "Screen Setup"
  chargeCategory: varchar("charge_category", { length: 20 }).notNull().default("run"), // 'run' (per unit) or 'fixed' (one-time)
  netCost: decimal("net_cost", { precision: 10, scale: 2 }).notNull().default("0"), // Our cost from vendor
  margin: decimal("margin", { precision: 5, scale: 2 }).default("0"), // Markup percentage
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull().default("0"), // Client price
  quantity: integer("quantity").default(1), // For fixed charges (usually 1)
  displayMode: varchar("display_mode", { length: 30 }).notNull().default("display_to_client"),
  // 'include_in_price' — baked into unit price, hidden
  // 'display_to_client' — shown as separate line item
  // 'subtract_from_margin' — absorbed, hidden from client
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Artwork item files — multiple files per artwork location
export const artworkItemFiles = pgTable("artwork_item_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artworkItemId: varchar("artwork_item_id").notNull().references(() => artworkItems.id, { onDelete: 'cascade' }),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  sortOrder: integer("sort_order").default(0),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Artwork files (legacy — order-level file registry, separate from per-artwork files)
export const artworkFiles = pgTable("artwork_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  companyId: varchar("company_id").references(() => companies.id),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  filePath: varchar("file_path").notNull(),
  thumbnailPath: varchar("thumbnail_path"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Artwork approvals
export const artworkApprovals = pgTable("artwork_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  orderItemId: varchar("order_item_id").references(() => orderItems.id),
  artworkFileId: varchar("artwork_file_id").references(() => artworkFiles.id),
  artworkItemId: varchar("artwork_item_id").references(() => artworkItems.id),
  approvalToken: varchar("approval_token", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, declined
  clientEmail: varchar("client_email", { length: 255 }),
  clientName: varchar("client_name", { length: 255 }),
  sentAt: timestamp("sent_at"),
  approvedAt: timestamp("approved_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  pdfPath: varchar("pdf_path", { length: 500 }),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertArtworkFileSchema = createInsertSchema(artworkFiles).omit({
  id: true,
  createdAt: true,
});

export const insertArtworkChargeSchema = createInsertSchema(artworkCharges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type ArtworkItem = typeof artworkItems.$inferSelect;
export type InsertArtworkItem = typeof artworkItems.$inferInsert;
export type ArtworkFile = typeof artworkFiles.$inferSelect;
export type InsertArtworkFile = z.infer<typeof insertArtworkFileSchema>;
export type ArtworkCharge = typeof artworkCharges.$inferSelect;
export type InsertArtworkCharge = z.infer<typeof insertArtworkChargeSchema>;
export type ArtworkItemFile = typeof artworkItemFiles.$inferSelect;
