import { and, eq, gte, lte, sql, count } from "drizzle-orm";
import { db } from "../db";
import { orders, companies } from "@shared/schema";

interface AggregationIntent {
  type: "sum" | "count" | "avg";
  field: string;
  groupBy?: string;
}

interface AggregationFilters {
  stage?: string;
  dateFrom?: string;
  dateTo?: string;
  industry?: string;
  companyName?: string;
}

export interface AggregationResult {
  value: number;
  label: string;
  breakdown?: Array<{ key: string; value: number }>;
}

// Whitelist of allowed columns for aggregation
const ALLOWED_FIELDS: Record<string, any> = {
  total: orders.total,
  margin: orders.margin,
  id: orders.id,
};

const ALLOWED_GROUP_BY: Record<string, any> = {
  stage: sql`
    CASE
      WHEN ${orders.salesOrderStatus} = 'ready_to_invoice' THEN 'invoice'
      WHEN ${orders.orderType} IN ('sales_order', 'rush_order') OR (${orders.salesOrderStatus} IS NOT NULL AND ${orders.salesOrderStatus} != 'new') THEN 'sales_order'
      WHEN ${orders.quoteStatus} IS NOT NULL AND ${orders.quoteStatus} != 'draft' THEN 'quote'
      ELSE 'presentation'
    END
  `,
  company: companies.name,
};

function buildFilterConditions(filters: AggregationFilters) {
  const conditions: any[] = [];

  if (filters.stage) {
    switch (filters.stage) {
      case "invoice":
        conditions.push(eq(orders.salesOrderStatus, "ready_to_invoice"));
        break;
      case "sales_order":
        conditions.push(
          sql`(${orders.orderType} IN ('sales_order', 'rush_order') OR (${orders.salesOrderStatus} IS NOT NULL AND ${orders.salesOrderStatus} != 'new'))`,
        );
        break;
      case "quote":
        conditions.push(
          sql`${orders.quoteStatus} IS NOT NULL AND ${orders.quoteStatus} != 'draft'`,
        );
        break;
    }
  }

  if (filters.dateFrom) {
    const d = new Date(filters.dateFrom);
    if (!isNaN(d.getTime())) conditions.push(gte(orders.createdAt, d));
  }
  if (filters.dateTo) {
    const d = new Date(filters.dateTo);
    if (!isNaN(d.getTime())) conditions.push(lte(orders.createdAt, d));
  }

  if (filters.industry) {
    conditions.push(sql`${companies.industry} ILIKE ${"%" + filters.industry + "%"}`);
  }

  if (filters.companyName) {
    conditions.push(sql`${companies.name} ILIKE ${"%" + filters.companyName + "%"}`);
  }

  return conditions;
}

export async function executeAggregation(
  aggregation: AggregationIntent,
  filters: AggregationFilters,
): Promise<AggregationResult | null> {
  const field = ALLOWED_FIELDS[aggregation.field];
  if (!field) return null;

  const conditions = buildFilterConditions(filters);
  const needsCompanyJoin = !!(filters.industry || filters.companyName || aggregation.groupBy === "company");

  try {
    // Grouped aggregation
    if (aggregation.groupBy && ALLOWED_GROUP_BY[aggregation.groupBy]) {
      const groupExpr = ALLOWED_GROUP_BY[aggregation.groupBy];

      let aggExpr: any;
      let label: string;

      switch (aggregation.type) {
        case "sum":
          aggExpr = sql<number>`COALESCE(SUM(CAST(${field} AS NUMERIC)), 0)`;
          label = `Total ${aggregation.field} by ${aggregation.groupBy}`;
          break;
        case "count":
          aggExpr = count(orders.id);
          label = `Count by ${aggregation.groupBy}`;
          break;
        case "avg":
          aggExpr = sql<number>`COALESCE(AVG(CAST(${field} AS NUMERIC)), 0)`;
          label = `Average ${aggregation.field} by ${aggregation.groupBy}`;
          break;
      }

      let query = db
        .select({
          groupKey: groupExpr.as("group_key"),
          aggValue: aggExpr.as("agg_value"),
        })
        .from(orders);

      if (needsCompanyJoin) {
        query = query.leftJoin(companies, eq(orders.companyId, companies.id)) as any;
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const rows = await (query as any).groupBy(groupExpr).orderBy(sql`agg_value DESC`).limit(20);

      const breakdown = rows.map((r: any) => ({
        key: String(r.groupKey || "Unknown"),
        value: Number(r.aggValue || 0),
      }));

      const totalValue = breakdown.reduce((sum: number, b: any) => sum + b.value, 0);

      return { value: totalValue, label, breakdown };
    }

    // Simple aggregation (no groupBy)
    let aggExpr: any;
    let label: string;

    switch (aggregation.type) {
      case "sum":
        aggExpr = sql<number>`COALESCE(SUM(CAST(${field} AS NUMERIC)), 0)`;
        label = `Total ${aggregation.field}`;
        break;
      case "count":
        aggExpr = count(orders.id);
        label = `Total count`;
        break;
      case "avg":
        aggExpr = sql<number>`COALESCE(AVG(CAST(${field} AS NUMERIC)), 0)`;
        label = `Average ${aggregation.field}`;
        break;
    }

    let query = db.select({ result: aggExpr.as("result") }).from(orders);

    if (needsCompanyJoin) {
      query = query.leftJoin(companies, eq(orders.companyId, companies.id)) as any;
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const [row] = await query;
    const value = Number((row as any)?.result || 0);

    return { value, label };
  } catch (err: any) {
    console.error(`[search.aggregation] Error: ${err.message}`);
    return null;
  }
}
