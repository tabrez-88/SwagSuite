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
import { users } from "./user.schema";

// AI Knowledge Base
export const knowledgeBase = pgTable("knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category"), // procedures, policies, training, etc.
  tags: jsonb("tags"),
  accessLevel: varchar("access_level").default("all"), // all, admin, department-specific
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  searchVector: text("search_vector"), // For full-text search
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing Sequences (HubSpot-style automation)
export const marketingSequences = pgTable("marketing_sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  targetAudience: varchar("target_audience"), // new_customers, existing_customers, etc.
  isActive: boolean("is_active").default(true),
  steps: jsonb("steps"), // Array of sequence steps with delays and content
  aiGenerated: boolean("ai_generated").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Automation Tasks and AI Drafts
export const automationTasks = pgTable("automation_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskType: varchar("task_type").notNull(), // vendor_followup, customer_outreach, etc.
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  status: varchar("status").default("pending"), // pending, approved, sent, cancelled
  aiDraftContent: text("ai_draft_content"),
  scheduledFor: timestamp("scheduled_for"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  metadata: jsonb("metadata"), // Context data for the task
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// News and Media Tracking (AI-powered)
export const newsTracking = pgTable("news_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // company, supplier, industry
  entityId: varchar("entity_id"),
  headline: varchar("headline").notNull(),
  summary: text("summary"),
  sourceUrl: varchar("source_url"),
  sentiment: varchar("sentiment"), // positive, negative, neutral
  relevanceScore: integer("relevance_score"), // 1-10
  alertsSent: boolean("alerts_sent").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
