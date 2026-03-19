import { eq, desc, ilike, like, and, sql } from "drizzle-orm";
import { db } from "../db";
import {
  mediaLibrary,
  type MediaLibraryItem,
  type InsertMediaLibraryItem,
} from "@shared/schema";

export class MediaLibraryRepository {
  async getMediaLibraryItems(filters?: {
    folder?: string;
    category?: string;
    companyId?: string;
    orderId?: string;
    mimeType?: string;
    search?: string;
    uploadedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<MediaLibraryItem[]> {
    const conditions = [];
    if (filters?.folder) conditions.push(eq(mediaLibrary.folder, filters.folder));
    if (filters?.category) conditions.push(eq(mediaLibrary.category, filters.category));
    if (filters?.companyId) conditions.push(eq(mediaLibrary.companyId, filters.companyId));
    if (filters?.orderId) conditions.push(eq(mediaLibrary.orderId, filters.orderId));
    if (filters?.mimeType) conditions.push(like(mediaLibrary.mimeType, `${filters.mimeType}%`));
    if (filters?.search) conditions.push(ilike(mediaLibrary.originalName, `%${filters.search}%`));
    if (filters?.uploadedBy) conditions.push(eq(mediaLibrary.uploadedBy, filters.uploadedBy));

    // Deduplicate by cloudinaryUrl — show each unique file only once (most recent)
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .selectDistinctOn([mediaLibrary.cloudinaryUrl])
      .from(mediaLibrary);

    const withWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;

    // DISTINCT ON requires cloudinaryUrl as first ORDER BY, then createdAt for picking newest
    const deduped = withWhere
      .orderBy(mediaLibrary.cloudinaryUrl, desc(mediaLibrary.createdAt));

    // Wrap as subquery so we can re-sort by createdAt and apply limit/offset
    const results = await db.select().from(deduped.as("deduped"))
      .orderBy(sql`created_at DESC`)
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);

    return results as MediaLibraryItem[];
  }

  async getMediaLibraryItem(id: string): Promise<MediaLibraryItem | undefined> {
    const [item] = await db.select().from(mediaLibrary).where(eq(mediaLibrary.id, id));
    return item;
  }

  async createMediaLibraryItem(item: InsertMediaLibraryItem): Promise<MediaLibraryItem> {
    const [created] = await db.insert(mediaLibrary).values(item).returning();
    return created;
  }

  async updateMediaLibraryItem(id: string, updates: Partial<InsertMediaLibraryItem>): Promise<MediaLibraryItem> {
    const [updated] = await db
      .update(mediaLibrary)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mediaLibrary.id, id))
      .returning();
    return updated;
  }

  async deleteMediaLibraryItem(id: string): Promise<void> {
    await db.delete(mediaLibrary).where(eq(mediaLibrary.id, id));
  }

  async getMediaLibraryItemsByIds(ids: string[]): Promise<MediaLibraryItem[]> {
    if (ids.length === 0) return [];
    const items = await db
      .select()
      .from(mediaLibrary)
      .where(sql`${mediaLibrary.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
    return items;
  }

  async getMediaLibraryCount(filters?: { folder?: string; category?: string; search?: string }): Promise<number> {
    const conditions = [];
    if (filters?.folder) conditions.push(eq(mediaLibrary.folder, filters.folder));
    if (filters?.category) conditions.push(eq(mediaLibrary.category, filters.category));
    if (filters?.search) conditions.push(ilike(mediaLibrary.originalName, `%${filters.search}%`));

    // Count unique files by cloudinaryUrl (deduplicated)
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const query = whereClause
      ? db.select({ count: sql<number>`count(DISTINCT ${mediaLibrary.cloudinaryUrl})` }).from(mediaLibrary).where(whereClause)
      : db.select({ count: sql<number>`count(DISTINCT ${mediaLibrary.cloudinaryUrl})` }).from(mediaLibrary);
    const [result] = await query;
    return Number(result.count);
  }
}

export const mediaLibraryRepository = new MediaLibraryRepository();
