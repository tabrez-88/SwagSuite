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

// Per-user email credentials (SMTP + IMAP)
export const userEmailSettings = pgTable("user_email_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // SMTP Settings
  smtpHost: varchar("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: varchar("smtp_user"),
  smtpPassword: text("smtp_password"),
  // IMAP Settings
  imapHost: varchar("imap_host"),
  imapPort: integer("imap_port"),
  imapUser: varchar("imap_user"),
  imapPassword: text("imap_password"),
  // Preferences
  isPrimary: boolean("is_primary").default(false),
  useDefaultForCompose: boolean("use_default_for_compose").default(false),
  hideNameOnSend: boolean("hide_name_on_send").default(false),
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System Branding and Theme Settings
export const systemBranding = pgTable("system_branding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Logo settings
  logoUrl: text("logo_url"),
  logoSize: varchar("logo_size").default("medium"),
  logoPosition: varchar("logo_position").default("left"),
  faviconUrl: text("favicon_url"),
  // Company branding
  companyName: varchar("company_name"),
  tagline: text("tagline"),
  // Theme colors
  primaryColor: varchar("primary_color").default("#3b82f6"),
  secondaryColor: varchar("secondary_color").default("#64748b"),
  accentColor: varchar("accent_color").default("#10b981"),
  backgroundColor: varchar("background_color").default("#ffffff"),
  textColor: varchar("text_color").default("#1f2937"),
  // Sidebar colors
  sidebarBackgroundColor: varchar("sidebar_background_color").default("#014559"),
  sidebarTextColor: varchar("sidebar_text_color").default("#ffffff"),
  sidebarBorderColor: varchar("sidebar_border_color").default("#374151"),
  // Navigation colors
  navHoverColor: varchar("nav_hover_color").default("#374151"),
  navActiveColor: varchar("nav_active_color").default("#3b82f6"),
  navTextColor: varchar("nav_text_color").default("#d1d5db"),
  navTextActiveColor: varchar("nav_text_active_color").default("#ffffff"),
  // Border and UI colors
  borderColor: varchar("border_color").default("#e5e7eb"),
  // Additional theme settings
  borderRadius: varchar("border_radius").default("medium"),
  fontFamily: varchar("font_family").default("inter"),
  // Metadata
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company Settings (feature toggles, general settings, margin settings)
export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Feature toggles (JSONB object: { feature_id: boolean })
  featureToggles: jsonb("feature_toggles").default({}),
  // General settings
  timezone: varchar("timezone").default("America/New_York"),
  currency: varchar("currency").default("USD"),
  dateFormat: varchar("date_format").default("MM/DD/YYYY"),
  // Margin settings
  defaultMargin: decimal("default_margin", { precision: 5, scale: 2 }).default("30"),
  minimumMargin: decimal("minimum_margin", { precision: 5, scale: 2 }).default("15"),
  maxOrderValue: decimal("max_order_value", { precision: 12, scale: 2 }).default("50000"),
  requireApprovalOver: decimal("require_approval_over", { precision: 12, scale: 2 }).default("5000"),
  // Order number format
  orderNumberPrefix: varchar("order_number_prefix").default(""),
  orderNumberDigits: integer("order_number_digits").default(5),
  // Metadata
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Templates (configurable email templates per type)
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateType: varchar("template_type").notNull(), // quote, sales_order, invoice, purchase_order, presentation, proof
  name: varchar("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(), // deprecated — kept for search/back-compat
  bodyHtml: text("body_html").default(""), // canonical HTML from Lexical (contains data-merge-tag spans)
  bodyJson: jsonb("body_json"), // Lexical SerializedEditorState for lossless round-trip
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserEmailSettingsSchema = createInsertSchema(userEmailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemBrandingSchema = createInsertSchema(systemBranding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UserEmailSettings = typeof userEmailSettings.$inferSelect;
export type InsertUserEmailSettings = z.infer<typeof insertUserEmailSettingsSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
