import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// CRM Payment Terms
export const paymentTerms = pgTable("payment_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymentTermSchema = createInsertSchema(paymentTerms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type PaymentTerm = typeof paymentTerms.$inferSelect;
export type InsertPaymentTerm = z.infer<typeof insertPaymentTermSchema>;
