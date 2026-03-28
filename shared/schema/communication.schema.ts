import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { orders } from "./order.schema";
import { users } from "./user.schema";

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

// Insert schemas
export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

// Types
export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = typeof communications.$inferInsert;
