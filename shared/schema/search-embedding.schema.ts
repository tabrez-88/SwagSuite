import { sql } from 'drizzle-orm';
import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Note: vector column type not directly supported by drizzle-orm,
// but the table is managed via raw SQL migrations.
// This schema is for type reference only.
export const searchEmbeddings = pgTable("search_embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  contentHash: varchar("content_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSearchEmbeddingSchema = createInsertSchema(searchEmbeddings);

export type SearchEmbedding = typeof searchEmbeddings.$inferSelect;
export type InsertSearchEmbedding = z.infer<typeof insertSearchEmbeddingSchema>;
