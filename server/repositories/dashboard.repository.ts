import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "../db";
import { companies, orders, orderServiceCharges, orderAdditionalCharges, orderShipments, type Order } from "@shared/schema";

const COMMITTED_STAGES = ["sales_order", "invoice"];
const PIPELINE_STAGES = ["presentation", "quote"];

/**
 * Pipeline = quote stage (quoteStatus beyond "draft") but NOT yet committed.
 * Presentations are implicitly pipeline if they exist (default stage).
 */
const isPipelineOrder = and(
  // Not committed
  sql`NOT (
    ${orders.salesOrderStatus} = 'ready_to_invoice'
    OR ${orders.orderType} IN ('sales_order', 'rush_order')
    OR (${orders.salesOrderStatus} IS NOT NULL AND ${orders.salesOrderStatus} != 'new')
  )`,
);

/**
 * SQL filter that mirrors client-side determineBusinessStage() logic.
 * An order is "committed" (sales_order or invoice) when:
 *  - salesOrderStatus = 'ready_to_invoice' (invoice stage)
 *  - orderType IN ('sales_order', 'rush_order')
 *  - salesOrderStatus is set and != 'new'
 */
const isCommittedOrder = or(
  eq(orders.salesOrderStatus, "ready_to_invoice"),
  inArray(orders.orderType, ["sales_order", "rush_order"]),
  and(
    sql`${orders.salesOrderStatus} IS NOT NULL`,
    sql`${orders.salesOrderStatus} != 'new'`,
  ),
);

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
        isCommittedOrder,
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
        .where(isPipelineOrder)
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
            isCommittedOrder,
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

  /**
   * Shipping & setup margin breakdown for Trello tickets 4+5.
   * Returns revenue/cost/margin for: product, shipping, setup categories.
   * Supports period filtering: ytd, mtd, wtd, custom.
   */
  async getShippingMarginReport(params: {
    period: "ytd" | "mtd" | "wtd" | "all" | "custom";
    from?: Date;
    to?: Date;
  }): Promise<{
    period: string;
    fromDate: string;
    toDate: string;
    overall: { revenue: number; cost: number; margin: number; marginPercent: number };
    product: { revenue: number; cost: number; margin: number; marginPercent: number };
    shipping: { revenue: number; cost: number; margin: number; marginPercent: number };
    setup: { revenue: number; cost: number; margin: number; marginPercent: number };
    orderCount: number;
  }> {
    const now = new Date();
    const year = now.getFullYear();

    let fromDate: Date;
    let toDate = new Date();

    switch (params.period) {
      case "mtd":
        fromDate = new Date(year, now.getMonth(), 1);
        break;
      case "wtd": {
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        fromDate.setDate(fromDate.getDate() - fromDate.getDay());
        break;
      }
      case "custom":
        fromDate = params.from || new Date(year, 0, 1);
        toDate = params.to || new Date();
        break;
      case "all":
        fromDate = new Date(2000, 0, 1);
        break;
      default: // ytd
        fromDate = new Date(year, 0, 1);
    }

    const dateConditions = [
      isCommittedOrder,
      gte(orders.createdAt, fromDate),
    ];
    if (params.period !== "all") {
      dateConditions.push(lte(orders.createdAt, toDate));
    }
    const dateFilter = and(...dateConditions);

    // 1. Overall order totals (revenue = total, cost derived from margin)
    const [orderTotals] = await db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
        totalCost: sql<string>`COALESCE(SUM(${orders.total} * (1 - ${orders.margin} / 100)), 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(orders)
      .where(dateFilter);

    // 2. Shipping service charges (chargeType in freight, shipping, fulfillment)
    const [shippingCharges] = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${orderServiceCharges.unitPrice} * ${orderServiceCharges.quantity}), 0)`,
        cost: sql<string>`COALESCE(SUM(${orderServiceCharges.unitCost} * ${orderServiceCharges.quantity}), 0)`,
      })
      .from(orderServiceCharges)
      .innerJoin(orders, eq(orderServiceCharges.orderId, orders.id))
      .where(
        and(
          dateFilter,
          sql`${orderServiceCharges.chargeType} IN ('freight', 'shipping', 'fulfillment')`,
        ),
      );

    // 3. Actual shipping costs from shipments (from ShipStation)
    const [shipmentCosts] = await db
      .select({
        totalCost: sql<string>`COALESCE(SUM(${orderShipments.shippingCost}), 0)`,
      })
      .from(orderShipments)
      .innerJoin(orders, eq(orderShipments.orderId, orders.id))
      .where(dateFilter);

    // 4. Setup charges (chargeCategory = 'fixed' on additional charges)
    // Use raw SQL to join through order_items → orders
    const setupResult = await db.execute<{
      revenue: string;
      cost: string;
    }>(sql`
      SELECT
        COALESCE(SUM(COALESCE(ac.retail_price, ac.amount) * ac.quantity), 0) as revenue,
        COALESCE(SUM(ac.net_cost * ac.quantity), 0) as cost
      FROM order_additional_charges ac
      INNER JOIN order_items oi ON ac.order_item_id = oi.id
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE (
        o.sales_order_status = 'ready_to_invoice'
        OR o.order_type IN ('sales_order', 'rush_order')
        OR (o.sales_order_status IS NOT NULL AND o.sales_order_status != 'new')
      )
        AND o.created_at >= ${fromDate}
        ${params.period !== "all" ? sql`AND o.created_at <= ${toDate}` : sql``}
        AND ac.charge_category = 'fixed'
    `);
    const setupCharges = setupResult.rows?.[0] ?? { revenue: "0", cost: "0" };

    const overallRevenue = parseFloat(orderTotals?.totalRevenue || "0");
    const overallCost = parseFloat(orderTotals?.totalCost || "0");

    const shippingRevenue = parseFloat(shippingCharges?.revenue || "0");
    // Use the higher of: service charge costs or actual shipment costs
    const shippingServiceCost = parseFloat(shippingCharges?.cost || "0");
    const shippingActualCost = parseFloat(shipmentCosts?.totalCost || "0");
    const shippingCost = Math.max(shippingServiceCost, shippingActualCost);

    const setupRevenue = parseFloat(setupCharges?.revenue || "0");
    const setupCost = parseFloat(setupCharges?.cost || "0");

    // Product = overall minus shipping and setup
    const productRevenue = overallRevenue - shippingRevenue - setupRevenue;
    const productCost = overallCost - shippingCost - setupCost;

    const calcMargin = (rev: number, cost: number) => ({
      revenue: Math.round(rev * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      margin: Math.round((rev - cost) * 100) / 100,
      marginPercent: rev > 0 ? Math.round(((rev - cost) / rev) * 1000) / 10 : 0,
    });

    return {
      period: params.period,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      overall: calcMargin(overallRevenue, overallCost),
      product: calcMargin(productRevenue, productCost),
      shipping: calcMargin(shippingRevenue, shippingCost),
      setup: calcMargin(setupRevenue, setupCost),
      orderCount: Number(orderTotals?.count || 0),
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
