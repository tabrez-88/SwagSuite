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

// Weekly Email Report Configuration
export const weeklyReportConfig = pgTable("weekly_report_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricName: varchar("metric_name").notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  dataSource: varchar("data_source").notNull(), // 'orders', 'revenue', 'margin', 'stores', 'custom'
  calculationMethod: varchar("calculation_method").notNull(), // 'count', 'sum', 'average', 'percentage'
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly Email Report Logs
export const weeklyReportLogs = pgTable("weekly_report_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  reportWeekStart: timestamp("report_week_start").notNull(),
  reportWeekEnd: timestamp("report_week_end").notNull(),
  metricsData: jsonb("metrics_data").notNull(), // Store calculated metrics
  emailSentAt: timestamp("email_sent_at"),
  emailStatus: varchar("email_status").default("pending"), // pending, sent, failed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertWeeklyReportConfigSchema = createInsertSchema(weeklyReportConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeeklyReportLogSchema = createInsertSchema(weeklyReportLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertWeeklyReportConfig = typeof weeklyReportConfig.$inferInsert;
export type WeeklyReportConfig = typeof weeklyReportConfig.$inferSelect;
export type InsertWeeklyReportLog = typeof weeklyReportLogs.$inferInsert;
export type WeeklyReportLog = typeof weeklyReportLogs.$inferSelect;
