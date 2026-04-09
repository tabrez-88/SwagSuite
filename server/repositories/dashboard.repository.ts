import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { companies, orders, type Order } from "@shared/schema";

const COMMITTED_STAGES = ["sales_order", "invoice"];
const PIPELINE_STAGES = ["presentation", "quote"];

export interface FinanceStats {
  ytdRevenue: number;
  lastYearYtdRevenue: number;
  mtdRevenue: number;
  lastMonthRevenue: number;
  wtdRevenue: number;
  todayRevenue: number;
  pipelineValue: number;
  pipelineOrderCount: number;
  conversionRate: number;
  avgOrderValue: number;
  orderQuantity: number;
  grossMargin: number;
}

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

  /**
   * Real finance stats for dashboard Finances tab.
   * Replaces the previously-hardcoded enhanced stats.
   *
   * Revenue is summed from orders that have advanced to sales_order or invoice stage
   * (mirrors CompanyService.getSpendingReport committed-stages logic).
   */
  async getFinanceStats(): Promise<FinanceStats> {
    const now = new Date();
    const year = now.getFullYear();

    const yearStart = new Date(year, 0, 1);
    const monthStart = new Date(year, now.getMonth(), 1);
    const lastMonthStart = new Date(year, now.getMonth() - 1, 1);
    // Start of week (Sunday)
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const todayStart = new Date(year, now.getMonth(), now.getDate());
    const lastYearStart = new Date(year - 1, 0, 1);
    // Same day last year (for apples-to-apples YTD comparison)
    const lastYearSameDay = new Date(year - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const committedRevenue = async (from: Date, to?: Date) => {
      const conditions = [
        inArray(orders.currentStage, COMMITTED_STAGES),
        gte(orders.createdAt, from),
      ];
      if (to) conditions.push(lte(orders.createdAt, to));
      const [row] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(orders)
        .where(and(...conditions));
      return {
        total: parseFloat(row?.total || "0"),
        count: Number(row?.count || 0),
      };
    };

    const [
      ytd,
      lastYearYtd,
      mtd,
      lastMonth,
      wtd,
      today,
      pipeline,
      allYtdCount,
      marginRow,
    ] = await Promise.all([
      committedRevenue(yearStart),
      committedRevenue(lastYearStart, lastYearSameDay),
      committedRevenue(monthStart),
      committedRevenue(lastMonthStart, monthStart),
      committedRevenue(weekStart),
      committedRevenue(todayStart),
      // Pipeline: quotes + presentations not yet converted
      db
        .select({
          total: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(orders)
        .where(inArray(orders.currentStage, PIPELINE_STAGES))
        .then(([r]) => ({
          total: parseFloat(r?.total || "0"),
          count: Number(r?.count || 0),
        })),
      // Conversion rate denominator: all orders created YTD (any stage)
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(orders)
        .where(gte(orders.createdAt, yearStart))
        .then(([r]) => Number(r?.count || 0)),
      // Weighted gross margin across committed YTD orders
      db
        .select({
          weightedMargin: sql<string>`COALESCE(SUM(${orders.margin} * ${orders.total}) / NULLIF(SUM(${orders.total}), 0), 0)`,
        })
        .from(orders)
        .where(
          and(
            inArray(orders.currentStage, COMMITTED_STAGES),
            gte(orders.createdAt, yearStart),
          ),
        )
        .then(([r]) => parseFloat(r?.weightedMargin || "0")),
    ]);

    const conversionRate = allYtdCount > 0 ? (ytd.count / allYtdCount) * 100 : 0;
    const avgOrderValue = ytd.count > 0 ? ytd.total / ytd.count : 0;

    return {
      ytdRevenue: ytd.total,
      lastYearYtdRevenue: lastYearYtd.total,
      mtdRevenue: mtd.total,
      lastMonthRevenue: lastMonth.total,
      wtdRevenue: wtd.total,
      todayRevenue: today.total,
      pipelineValue: pipeline.total,
      pipelineOrderCount: pipeline.count,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      orderQuantity: ytd.count,
      grossMargin: Math.round(marginRow * 10) / 10,
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
