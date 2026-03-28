import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { companies } from "./company.schema";
import { suppliers } from "./supplier.schema";

// Contacts within companies and suppliers
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  title: varchar("title"),
  isPrimary: boolean("is_primary").default(false),
  receiveOrderEmails: boolean("receive_order_emails").default(true),
  leadSource: varchar("lead_source"),
  // CommonSKU-style fields
  department: varchar("department"), // executive, marketing, shop, sales, purchasing, accounting, administration, hr, other
  isActive: boolean("is_active").default(true), // Soft delete (CommonSKU never hard-deletes)
  mailingAddress: text("mailing_address"), // Personal mailing address for reports
  noMarketing: boolean("no_marketing").default(false), // Opt out of marketing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
