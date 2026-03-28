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

// Company Addresses (CommonSKU-style: separate entity per company)
export const companyAddresses = pgTable("company_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  addressName: varchar("address_name"), // Internal label (e.g., "HQ", "Warehouse LA")
  companyNameOnDocs: varchar("company_name_on_docs"), // Override company name on external documents
  street: text("street"),
  street2: text("street2"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  country: varchar("country").default("US"),
  addressType: varchar("address_type").notNull().default("both"), // 'billing' | 'shipping' | 'both'
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertCompanyAddressSchema = createInsertSchema(companyAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type CompanyAddress = typeof companyAddresses.$inferSelect;
export type InsertCompanyAddress = z.infer<typeof insertCompanyAddressSchema>;
