import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Companies/Customers
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  website: varchar("website"),
  industry: varchar("industry"),
  notes: text("notes"),
  ytdSpend: decimal("ytd_spend", { precision: 12, scale: 2 }).default("0"),
  // HubSpot integration fields
  hubspotId: varchar("hubspot_id"),
  hubspotSyncedAt: timestamp("hubspot_synced_at"),
  // Financial Integrations
  qbCustomerId: varchar("qb_customer_id"), // Map to QuickBooks Customer
  stripeCustomerId: varchar("stripe_customer_id"), // Map to Stripe Customer
  taxExempt: boolean("tax_exempt").default(false), // TaxJar Exemption Flag
  // Social media integration
  socialMediaLinks: jsonb("social_media_links"), // { linkedin: "url", twitter: "url", facebook: "url" }
  socialMediaPosts: jsonb("social_media_posts"), // Array of recent posts with content and timestamps
  lastSocialMediaSync: timestamp("last_social_media_sync"),
  // AI-powered insights
  lastNewsUpdate: timestamp("last_news_update"),
  newsAlerts: jsonb("news_alerts"),
  excitingNewsFlags: jsonb("exciting_news_flags"), // Array of flagged posts containing "exciting news"
  // Customer scoring and analytics
  customerScore: integer("customer_score").default(0),
  engagementLevel: varchar("engagement_level"), // high, medium, low
  customFields: jsonb("custom_fields"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).extend({
  linkedinUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  otherSocialUrl: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
