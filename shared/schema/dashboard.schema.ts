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
import { users } from "./user.schema";

// KPI Tracking
export const kpiMetrics = pgTable("kpi_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  metricType: varchar("metric_type").notNull(), // revenue, orders, contacts, errors, etc.
  period: varchar("period").notNull(), // daily, weekly, monthly, yearly
  periodDate: timestamp("period_date").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  target: decimal("target", { precision: 12, scale: 2 }),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
});

// Slack Integration Messages
export const slackMessages = pgTable("slack_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull(),
  messageId: varchar("message_id").notNull(),
  userId: varchar("user_id"),
  content: text("content"),
  attachments: jsonb("attachments"),
  threadTs: varchar("thread_ts"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Report Templates (AI-generated and saved)
export const reportTemplates = pgTable("report_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  query: text("query").notNull(), // Natural language or SQL query
  parameters: jsonb("parameters"), // Dynamic parameters for the report
  schedule: varchar("schedule"), // cron-like schedule for automated reports
  recipients: jsonb("recipients"), // Email addresses for scheduled reports
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type SlackMessage = typeof slackMessages.$inferSelect;
export type InsertSlackMessage = typeof slackMessages.$inferInsert;
