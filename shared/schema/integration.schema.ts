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
import { users } from "./user.schema";

// Integration Settings table
export const integrationSettings = pgTable("integration_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // S&S Activewear Integration
  ssActivewearAccount: varchar("ss_activewear_account"),
  ssActivewearApiKey: text("ss_activewear_api_key"),
  // SanMar Integration (SOAP API)
  sanmarCustomerId: varchar("sanmar_customer_id"),
  sanmarUsername: varchar("sanmar_username"),
  sanmarPassword: text("sanmar_password"),
  // Slack Integration
  slackBotToken: text("slack_bot_token"),
  slackChannelId: varchar("slack_channel_id"),
  // HubSpot Integration
  hubspotApiKey: text("hubspot_api_key"),
  // SAGE Integration
  sageAcctId: varchar("sage_acct_id"),
  sageLoginId: varchar("sage_login_id"),
  sageApiKey: text("sage_api_key"),
  // Geoapify Geocoding Integration (Address Autocomplete)
  geoapifyApiKey: text("geoapify_api_key"),
  // Email Integration
  emailProvider: varchar("email_provider"),
  smtpHost: varchar("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: varchar("smtp_user"),
  smtpPassword: text("smtp_password"),
  emailFromAddress: varchar("email_from_address"),
  emailFromName: varchar("email_from_name"),
  emailReplyTo: varchar("email_reply_to"),
  // Connection status flags
  quickbooksConnected: boolean("quickbooks_connected").default(false),
  stripeConnected: boolean("stripe_connected").default(false),
  shipmateConnected: boolean("shipmate_connected").default(false),
  // QuickBooks Integration (OAuth)
  qbRealmId: varchar("qb_realm_id"),
  qbAccessToken: text("qb_access_token"),
  qbRefreshToken: text("qb_refresh_token"),
  qbClientId: text("qb_client_id"),
  qbClientSecret: text("qb_client_secret"),

  // Stripe Integration
  stripePublishableKey: text("stripe_publishable_key"),
  stripeSecretKey: text("stripe_secret_key"),
  stripeWebhookSecret: text("stripe_webhook_secret"),

  // TaxJar Integration
  taxjarApiKey: text("taxjar_api_key"),

  // Metadata
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Integration Sync Logs
export const integrationSyncs = pgTable("integration_syncs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationType: varchar("integration_type").notNull(), // hubspot, slack, esp, asi, sage
  syncType: varchar("sync_type").notNull(), // full, incremental, manual
  status: varchar("status").notNull(), // success, error, in_progress
  recordsProcessed: integer("records_processed").default(0),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Integration configurations and API management
export const integrationConfigurations = pgTable("integration_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integration: varchar("integration").notNull().unique(), // 'esp', 'sage', 'dc'
  displayName: varchar("display_name").notNull(),
  apiEndpoint: varchar("api_endpoint"),
  apiVersion: varchar("api_version"),
  syncEnabled: boolean("sync_enabled").default(false),
  syncFrequency: varchar("sync_frequency").default('daily'),
  categoryFilters: text("category_filters").array(),
  supplierFilters: text("supplier_filters").array(),
  priceRangeMin: decimal("price_range_min"),
  priceRangeMax: decimal("price_range_max"),
  maxApiCallsPerHour: integer("max_api_calls_per_hour").default(1000),
  isHealthy: boolean("is_healthy").default(true),
  lastHealthCheck: timestamp("last_health_check"),
  totalSyncs: integer("total_syncs").default(0),
  totalRecordsSynced: integer("total_records_synced").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertIntegrationSettingsSchema = createInsertSchema(integrationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type IntegrationSettings = typeof integrationSettings.$inferSelect;
export type InsertIntegrationSettings = z.infer<typeof insertIntegrationSettingsSchema>;
export type IntegrationConfig = typeof integrationConfigurations.$inferSelect;
