import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Sequence Builder Tables
export const sequences = pgTable("sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").notNull(),
  status: varchar("status").notNull().default("draft"), // draft, active, paused, archived
  totalSteps: integer("total_steps").notNull().default(0),
  automation: integer("automation").notNull().default(100), // percentage of automation
  unenrollCriteria: text("unenroll_criteria"), // JSON array of criteria
  settings: text("settings"), // JSON settings object
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sequenceSteps = pgTable("sequence_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sequenceId: varchar("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // email, task, call, linkedin_message
  position: integer("position").notNull(),
  title: varchar("title").notNull(),
  content: text("content"), // Email content or task description
  delayDays: integer("delay_days").notNull().default(1),
  delayHours: integer("delay_hours").notNull().default(0),
  delayMinutes: integer("delay_minutes").notNull().default(0),
  settings: text("settings"), // JSON settings for the step
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sequenceEnrollments = pgTable("sequence_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sequenceId: varchar("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" }),
  contactId: varchar("contact_id").notNull(), // Can reference companies or leads
  contactType: varchar("contact_type").notNull(), // company, lead
  status: varchar("status").notNull().default("active"), // active, paused, completed, unenrolled
  currentStep: integer("current_step").notNull().default(1),
  enrolledBy: varchar("enrolled_by").notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  unenrolledAt: timestamp("unenrolled_at"),
  unenrollReason: varchar("unenroll_reason"),
});

export const sequenceStepExecutions = pgTable("sequence_step_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id").notNull().references(() => sequenceEnrollments.id, { onDelete: "cascade" }),
  stepId: varchar("step_id").notNull().references(() => sequenceSteps.id, { onDelete: "cascade" }),
  status: varchar("status").notNull().default("pending"), // pending, sent, opened, clicked, replied, failed, skipped
  scheduledAt: timestamp("scheduled_at"),
  executedAt: timestamp("executed_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  repliedAt: timestamp("replied_at"),
  bounced: boolean("bounced").default(false),
  metadata: text("metadata"), // JSON metadata for tracking
});

export const sequenceTemplates = pgTable("sequence_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // new_client, existing_client, general
  industryType: varchar("industry_type"), // promotional_products, general
  steps: text("steps").notNull(), // JSON array of step templates
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sequenceAnalytics = pgTable("sequence_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sequenceId: varchar("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(),
  totalEnrollments: integer("total_enrollments").default(0),
  totalSent: integer("total_sent").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalReplied: integer("total_replied").default(0),
  totalBounced: integer("total_bounced").default(0),
  totalMeetingsBooked: integer("total_meetings_booked").default(0),
  totalDealsCreated: integer("total_deals_created").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
});

// Insert schemas
export const insertSequenceSchema = createInsertSchema(sequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSequenceStepSchema = createInsertSchema(sequenceSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSequenceEnrollmentSchema = createInsertSchema(sequenceEnrollments).omit({
  id: true,
  enrolledAt: true,
  completedAt: true,
});

export const insertSequenceAnalyticsSchema = createInsertSchema(sequenceAnalytics).omit({
  id: true,
});

// Types
export type Sequence = typeof sequences.$inferSelect;
export type InsertSequence = typeof sequences.$inferInsert;
export type SequenceStep = typeof sequenceSteps.$inferSelect;
export type InsertSequenceStep = typeof sequenceSteps.$inferInsert;
export type SequenceEnrollment = typeof sequenceEnrollments.$inferSelect;
export type InsertSequenceEnrollment = typeof sequenceEnrollments.$inferInsert;
export type SequenceStepExecution = typeof sequenceStepExecutions.$inferSelect;
export type InsertSequenceStepExecution = typeof sequenceStepExecutions.$inferInsert;
export type SequenceTemplate = typeof sequenceTemplates.$inferSelect;
export type InsertSequenceTemplate = typeof sequenceTemplates.$inferInsert;
export type SequenceAnalytics = typeof sequenceAnalytics.$inferSelect;
export type InsertSequenceAnalytics = typeof sequenceAnalytics.$inferInsert;
