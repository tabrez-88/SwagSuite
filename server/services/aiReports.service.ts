import OpenAI from "openai";
import { db } from "../db";
import {
  orders,
  companies,
  contacts,
  orderItems,
  suppliers,
  users,
} from "@shared/schema";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

// ──────── Init ────────

const openai =
  process.env.OPENAI_API_KEY?.trim()
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim() })
    : null;

// ──────── Canned Report Definitions ────────

export interface ReportDef {
  id: string;
  name: string;
  description: string;
  params: string[];
  /** Executes the report and returns structured rows */
  execute: (params: Record<string, string>) => Promise<any[]>;
}

const COMMITTED_STAGES = ["sales_order", "invoice"];

/** Parse a date-ish string or return undefined. */
function dateOrUndefined(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

const REPORTS: ReportDef[] = [
  // 1. Margin summary across orders
  {
    id: "margin_summary",
    name: "Order Margin Summary",
    description:
      "Summarizes revenue, cost, and margin across committed orders within a date range.",
    params: ["from", "to"],
    async execute(p) {
      const from = dateOrUndefined(p.from) ?? yearStart();
      const to = dateOrUndefined(p.to) ?? new Date();
      const rows = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          projectName: orders.projectName,
          companyName: companies.name,
          total: orders.total,
          margin: orders.margin,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .leftJoin(companies, eq(orders.companyId, companies.id))
        .where(
          and(
            inArray(orders.currentStage, COMMITTED_STAGES),
            gte(orders.createdAt, from),
            lte(orders.createdAt, to),
          ),
        )
        .orderBy(desc(orders.createdAt));
      return rows.map((r) => ({
        ...r,
        total: parseFloat(r.total || "0"),
        margin: parseFloat(r.margin || "0"),
      }));
    },
  },

  // 2. Top vendors by spend
  {
    id: "top_vendors_by_spend",
    name: "Top Vendors by Spend",
    description:
      "Ranks vendors by total cost (from order items) within a date range.",
    params: ["from", "to", "limit"],
    async execute(p) {
      const from = dateOrUndefined(p.from) ?? yearStart();
      const to = dateOrUndefined(p.to) ?? new Date();
      const limit = parseInt(p.limit || "20", 10);
      return db
        .select({
          supplierId: orderItems.supplierId,
          supplierName: suppliers.name,
          totalCost: sql<string>`COALESCE(SUM(${orderItems.cost} * ${orderItems.quantity}), 0)`,
          totalRevenue: sql<string>`COALESCE(SUM(${orderItems.totalPrice}), 0)`,
          itemCount: sql<number>`COUNT(*)::int`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .leftJoin(suppliers, eq(orderItems.supplierId, suppliers.id))
        .where(
          and(
            inArray(orders.currentStage, COMMITTED_STAGES),
            gte(orders.createdAt, from),
            lte(orders.createdAt, to),
          ),
        )
        .groupBy(orderItems.supplierId, suppliers.name)
        .orderBy(sql`SUM(${orderItems.cost} * ${orderItems.quantity}) DESC`)
        .limit(limit);
    },
  },

  // 3. Top customers by spend
  {
    id: "top_customers_by_spend",
    name: "Top Customers by Spend",
    description:
      "Ranks companies by total order revenue within a date range.",
    params: ["from", "to", "limit"],
    async execute(p) {
      const from = dateOrUndefined(p.from) ?? yearStart();
      const to = dateOrUndefined(p.to) ?? new Date();
      const limit = parseInt(p.limit || "20", 10);
      return db
        .select({
          companyId: orders.companyId,
          companyName: companies.name,
          totalSpend: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
          orderCount: sql<number>`COUNT(*)::int`,
        })
        .from(orders)
        .leftJoin(companies, eq(orders.companyId, companies.id))
        .where(
          and(
            inArray(orders.currentStage, COMMITTED_STAGES),
            gte(orders.createdAt, from),
            lte(orders.createdAt, to),
          ),
        )
        .groupBy(orders.companyId, companies.name)
        .orderBy(sql`SUM(${orders.total}) DESC`)
        .limit(limit);
    },
  },

  // 4. Overdue orders
  {
    id: "overdue_orders",
    name: "Overdue Orders",
    description: "Lists orders where in-hands date has passed but stage is not invoice.",
    params: [],
    async execute() {
      const now = new Date();
      return db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          projectName: orders.projectName,
          companyName: companies.name,
          inHandsDate: orders.inHandsDate,
          currentStage: orders.currentStage,
          total: orders.total,
          assignedUser: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, '')`,
        })
        .from(orders)
        .leftJoin(companies, eq(orders.companyId, companies.id))
        .leftJoin(users, eq(orders.assignedUserId, users.id))
        .where(
          and(
            lte(orders.inHandsDate, now),
            // Not yet fully completed — still in production or earlier
            sql`${orders.currentStage} NOT IN ('invoice')`,
          ),
        )
        .orderBy(orders.inHandsDate);
    },
  },

  // 5. Inactive customers
  {
    id: "inactive_customers",
    name: "Inactive Customers",
    description: "Companies with no orders in the last N days.",
    params: ["days"],
    async execute(p) {
      const days = parseInt(p.days || "90", 10);
      const cutoff = new Date(Date.now() - days * 86_400_000);
      return db
        .select({
          id: companies.id,
          name: companies.name,
          email: companies.email,
          phone: companies.phone,
          lastOrderDate: sql<string>`MAX(${orders.createdAt})`,
          totalOrders: sql<number>`COUNT(${orders.id})::int`,
        })
        .from(companies)
        .leftJoin(orders, eq(orders.companyId, companies.id))
        .groupBy(companies.id)
        .having(
          sql`MAX(${orders.createdAt}) IS NULL OR MAX(${orders.createdAt}) < ${cutoff}`,
        )
        .orderBy(sql`MAX(${orders.createdAt}) ASC NULLS FIRST`);
    },
  },

  // 6. Orders by salesperson
  {
    id: "orders_by_salesperson",
    name: "Orders by Salesperson",
    description:
      "Revenue and order count grouped by assigned sales rep for a date range.",
    params: ["from", "to"],
    async execute(p) {
      const from = dateOrUndefined(p.from) ?? yearStart();
      const to = dateOrUndefined(p.to) ?? new Date();
      return db
        .select({
          userId: orders.assignedUserId,
          salesRepName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, 'Unassigned')`,
          totalRevenue: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
          orderCount: sql<number>`COUNT(*)::int`,
          avgOrderValue: sql<string>`COALESCE(AVG(${orders.total}), 0)`,
          avgMargin: sql<string>`COALESCE(AVG(${orders.margin}), 0)`,
        })
        .from(orders)
        .leftJoin(users, eq(orders.assignedUserId, users.id))
        .where(
          and(
            inArray(orders.currentStage, COMMITTED_STAGES),
            gte(orders.createdAt, from),
            lte(orders.createdAt, to),
          ),
        )
        .groupBy(orders.assignedUserId, users.firstName, users.lastName)
        .orderBy(sql`SUM(${orders.total}) DESC`);
    },
  },
];

function yearStart() {
  return new Date(new Date().getFullYear(), 0, 1);
}

// ──────── OpenAI NL Router ────────

const REPORT_LIST_PROMPT = REPORTS.map(
  (r) => `- ${r.id}: ${r.description} (params: ${r.params.join(", ") || "none"})`,
).join("\n");

interface RouteResult {
  reportId: string;
  params: Record<string, string>;
}

async function routeQuery(query: string): Promise<RouteResult> {
  if (!openai) {
    // Fallback heuristic when no API key
    return heuristicRoute(query);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a report router. Given a natural language query about business data, pick the best matching report template and extract parameters.

Available reports:
${REPORT_LIST_PROMPT}

Respond in JSON only (no markdown, no code fences):
{"reportId": "...", "params": {"from": "YYYY-MM-DD", "to": "YYYY-MM-DD", ...}}

For date-relative phrases: today is ${new Date().toISOString().split("T")[0]}. "Last 6 weeks" → from = 6 weeks ago, "this quarter" → from = quarter start, "last year" → from/to = last calendar year, "this month" → from = month start. Always compute concrete dates.
If no date is mentioned, omit from/to to use defaults.`,
        },
        { role: "user", content: query },
      ],
    });

    const text = response.choices[0]?.message?.content || "";

    const parsed = JSON.parse(text.trim());
    if (REPORTS.find((r) => r.id === parsed.reportId)) {
      return {
        reportId: parsed.reportId,
        params: parsed.params || {},
      };
    }
  } catch {
    // JSON parse failure or API error — fall through to heuristic
  }

  return heuristicRoute(query);
}

function heuristicRoute(query: string): RouteResult {
  const q = query.toLowerCase();
  if (/vendor|supplier|spend/i.test(q)) return { reportId: "top_vendors_by_spend", params: {} };
  if (/customer|client|top.*compan/i.test(q)) return { reportId: "top_customers_by_spend", params: {} };
  if (/overdue|late|past.*due/i.test(q)) return { reportId: "overdue_orders", params: {} };
  if (/inactive|churn|stop.*order|haven.*order/i.test(q)) return { reportId: "inactive_customers", params: {} };
  if (/salesperson|rep|commission|by.*person/i.test(q)) return { reportId: "orders_by_salesperson", params: {} };
  return { reportId: "margin_summary", params: {} };
}

// ──────── Public API ────────

export interface GeneratedReport {
  id: string;
  reportId: string;
  name: string;
  query: string;
  data: any[];
  summary: string;
  generatedAt: string;
  exportFormats: string[];
}

export async function generateReport(query: string): Promise<GeneratedReport> {
  // Step 1: Route NL query to a canned template
  const { reportId, params } = await routeQuery(query);

  const reportDef = REPORTS.find((r) => r.id === reportId)!;

  // Step 2: Execute the query
  const data = await reportDef.execute(params);

  // Step 3: Build a lightweight summary
  let summary: string;
  if (openai && data.length > 0) {
    try {
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "Summarize the following business report data in 2-3 concise sentences for a sales manager. Be specific with numbers.",
          },
          {
            role: "user",
            content: `Report: ${reportDef.name}\nUser asked: "${query}"\nRows returned: ${data.length}\nFirst 5 rows: ${JSON.stringify(data.slice(0, 5))}`,
          },
        ],
      });
      summary =
        resp.choices[0]?.message?.content ||
        `${reportDef.name}: ${data.length} results.`;
    } catch {
      summary = `${reportDef.name}: ${data.length} results.`;
    }
  } else {
    summary = data.length > 0
      ? `${reportDef.name}: ${data.length} results returned.`
      : `No results found for "${query}".`;
  }

  return {
    id: Date.now().toString(),
    reportId,
    name: reportDef.name,
    query,
    data,
    summary,
    generatedAt: new Date().toISOString(),
    exportFormats: ["csv", "json"],
  };
}

export function getAvailableReports() {
  return REPORTS.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    params: r.params,
  }));
}
