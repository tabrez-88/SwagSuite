import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./user.schema";

// Newsletter Schema
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  status: varchar("status").default("active"), // active, unsubscribed, bounced
  source: varchar("source"), // website, import, api, form
  tags: jsonb("tags").$type<string[]>(), // for segmentation
  customFields: jsonb("custom_fields"), // flexible data storage
  subscriptionDate: timestamp("subscription_date").defaultNow(),
  unsubscribeDate: timestamp("unsubscribe_date"),
  lastEmailSent: timestamp("last_email_sent"),
  engagementScore: integer("engagement_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterLists = pgTable("newsletter_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  subscriberCount: integer("subscriber_count").default(0),
  segmentRules: jsonb("segment_rules"), // advanced segmentation logic
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterTemplates = pgTable("newsletter_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subject: varchar("subject"),
  previewText: varchar("preview_text"),
  htmlContent: text("html_content"),
  designData: jsonb("design_data"), // drag-and-drop editor data
  thumbnailUrl: varchar("thumbnail_url"),
  category: varchar("category"), // business, promotional, newsletter, etc.
  isPublic: boolean("is_public").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subject: varchar("subject").notNull(),
  previewText: varchar("preview_text"),
  fromName: varchar("from_name").notNull(),
  fromEmail: varchar("from_email").notNull(),
  replyTo: varchar("reply_to"),
  htmlContent: text("html_content"),
  status: varchar("status").default("draft"), // draft, scheduled, sending, sent, paused
  type: varchar("type").default("regular"), // regular, automation, ab_test
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  listId: varchar("list_id").references(() => newsletterLists.id),
  templateId: varchar("template_id").references(() => newsletterTemplates.id),
  // Analytics
  totalSent: integer("total_sent").default(0),
  delivered: integer("delivered").default(0),
  opens: integer("opens").default(0),
  clicks: integer("clicks").default(0),
  unsubscribes: integer("unsubscribes").default(0),
  bounces: integer("bounces").default(0),
  // A/B Testing
  abTestSettings: jsonb("ab_test_settings"),
  // Automation
  automationRules: jsonb("automation_rules"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterAnalytics = pgTable("newsletter_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => newsletterCampaigns.id),
  subscriberId: varchar("subscriber_id").references(() => newsletterSubscribers.id),
  eventType: varchar("event_type").notNull(), // sent, delivered, opened, clicked, unsubscribed, bounced
  eventData: jsonb("event_data"), // additional event metadata
  userAgent: varchar("user_agent"),
  ipAddress: varchar("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const newsletterForms = pgTable("newsletter_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  title: varchar("title"),
  description: text("description"),
  formFields: jsonb("form_fields"), // field configuration
  formSettings: jsonb("form_settings"), // styling, behavior
  embedCode: text("embed_code"),
  isActive: boolean("is_active").default(true),
  conversions: integer("conversions").default(0),
  views: integer("views").default(0),
  listId: varchar("list_id").references(() => newsletterLists.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterAutomations = pgTable("newsletter_automations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  trigger: varchar("trigger").notNull(), // signup, birthday, purchase, custom
  triggerData: jsonb("trigger_data"), // trigger configuration
  workflow: jsonb("workflow"), // automation steps and logic
  isActive: boolean("is_active").default(true),
  totalTriggered: integer("total_triggered").default(0),
  listId: varchar("list_id").references(() => newsletterLists.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers);
export const insertNewsletterListSchema = createInsertSchema(newsletterLists);
export const insertNewsletterTemplateSchema = createInsertSchema(newsletterTemplates);
export const insertNewsletterCampaignSchema = createInsertSchema(newsletterCampaigns);
export const insertNewsletterAnalyticsSchema = createInsertSchema(newsletterAnalytics);
export const insertNewsletterFormSchema = createInsertSchema(newsletterForms);
export const insertNewsletterAutomationSchema = createInsertSchema(newsletterAutomations);

// Types
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewsletterList = typeof newsletterLists.$inferSelect;
export type NewsletterTemplate = typeof newsletterTemplates.$inferSelect;
export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;
export type NewsletterAnalytics = typeof newsletterAnalytics.$inferSelect;
export type NewsletterForm = typeof newsletterForms.$inferSelect;
export type NewsletterAutomation = typeof newsletterAutomations.$inferSelect;

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type InsertNewsletterList = z.infer<typeof insertNewsletterListSchema>;
export type InsertNewsletterTemplate = z.infer<typeof insertNewsletterTemplateSchema>;
export type InsertNewsletterCampaign = z.infer<typeof insertNewsletterCampaignSchema>;
export type InsertNewsletterAnalytics = z.infer<typeof insertNewsletterAnalyticsSchema>;
export type InsertNewsletterForm = z.infer<typeof insertNewsletterFormSchema>;
export type InsertNewsletterAutomation = z.infer<typeof insertNewsletterAutomationSchema>;
