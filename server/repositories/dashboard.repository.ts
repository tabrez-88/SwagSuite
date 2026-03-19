import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { companies, orders, type Order } from "@shared/schema";

export class DashboardRepository {
  async getStats(): Promise<{
    totalRevenue: number;
    activeOrders: number;
    grossMargin: number;
    customerCount: number;
  }> {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const revenueResult = await db
      .select({ total: sql`COALESCE(SUM(${orders.total}), 0)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, yearStart),
          eq(orders.status, 'approved' as any)
        )
      );

    const activeOrdersResult = await db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(eq(orders.status, 'in_production' as any));

    const customerCountResult = await db
      .select({ count: sql`count(*)` })
      .from(companies);

    const marginResult = await db
      .select({ avgMargin: sql`COALESCE(AVG(${orders.margin}), 0)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, yearStart),
          eq(orders.status, 'approved' as any)
        )
      );

    return {
      totalRevenue: Number(revenueResult[0].total) || 0,
      activeOrders: Number(activeOrdersResult[0].count) || 0,
      grossMargin: Number(marginResult[0].avgMargin) || 0,
      customerCount: Number(customerCountResult[0].count) || 0,
    };
  }

  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async getTeamLeaderboard(): Promise<any[]> {
    return [];
  }
}

export const dashboardRepository = new DashboardRepository();
