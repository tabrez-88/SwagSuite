import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  weeklyReportConfig,
  weeklyReportLogs,
  type WeeklyReportConfig,
  type InsertWeeklyReportConfig,
  type WeeklyReportLog,
  type InsertWeeklyReportLog,
} from "@shared/schema";

export class WeeklyReportRepository {
  // ── Weekly Report Config ──

  async getWeeklyReportConfigs(): Promise<WeeklyReportConfig[]> {
    return await db
      .select()
      .from(weeklyReportConfig)
      .orderBy(weeklyReportConfig.sortOrder);
  }

  async createWeeklyReportConfig(
    config: InsertWeeklyReportConfig
  ): Promise<WeeklyReportConfig> {
    const [created] = await db
      .insert(weeklyReportConfig)
      .values(config)
      .returning();
    return created;
  }

  async updateWeeklyReportConfig(
    id: string,
    config: Partial<InsertWeeklyReportConfig>
  ): Promise<WeeklyReportConfig> {
    const [updated] = await db
      .update(weeklyReportConfig)
      .set(config)
      .where(eq(weeklyReportConfig.id, id))
      .returning();
    return updated;
  }

  async deleteWeeklyReportConfig(id: string): Promise<void> {
    await db
      .delete(weeklyReportConfig)
      .where(eq(weeklyReportConfig.id, id));
  }

  // ── Weekly Report Logs ──

  async getWeeklyReportLogs(userId?: string): Promise<WeeklyReportLog[]> {
    const query = db.select().from(weeklyReportLogs);
    if (userId) {
      return await query
        .where(eq(weeklyReportLogs.userId, userId))
        .orderBy(desc(weeklyReportLogs.createdAt));
    }
    return await query.orderBy(desc(weeklyReportLogs.createdAt));
  }

  async createWeeklyReportLog(
    log: InsertWeeklyReportLog
  ): Promise<WeeklyReportLog> {
    const [created] = await db
      .insert(weeklyReportLogs)
      .values(log)
      .returning();
    return created;
  }

  async updateWeeklyReportLog(
    id: string,
    log: Partial<InsertWeeklyReportLog>
  ): Promise<WeeklyReportLog> {
    const [updated] = await db
      .update(weeklyReportLogs)
      .set(log)
      .where(eq(weeklyReportLogs.id, id))
      .returning();
    return updated;
  }
}

export const weeklyReportRepository = new WeeklyReportRepository();
