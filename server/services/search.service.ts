import OpenAI from "openai";
import { and, desc, eq, gte, lte, ilike, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  orders,
  products,
  companies,
  contacts,
  orderItems,
  orderServiceCharges,
  orderShipments,
  activities,
  projectActivities,
} from "@shared/schema";
import { suppliers } from "@shared/schema/supplier.schema";
import { purchaseOrders } from "@shared/schema/purchase-order.schema";
import { executeAggregation, type AggregationResult } from "./search.aggregation";
import { semanticSearch, isSemanticSearchAvailable } from "./search.embeddings";

// ──────── OpenAI Client (lazy init) ────────

let openai: OpenAI | null = null;
let openaiInitialized = false;

function getOpenAI(): OpenAI | null {
  if (!openaiInitialized) {
    openaiInitialized = true;
    openai = process.env.OPENAI_API_KEY?.trim()
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim() })
      : null;
    console.log(`[search.service] OpenAI client: ${openai ? "ENABLED (AI search active)" : "DISABLED — OPENAI_API_KEY not set, using keyword fallback"}`);
  }
  return openai;
}

// ──────── Types ────────

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  url: string;
}

export type EntityType = "order" | "product" | "company" | "contact" | "vendor" | "purchase_order" | "shipment" | "activity";

interface SearchIntent {
  entityTypes: EntityType[];
  keywords: string;
  filters?: {
    minMarginPct?: number;
    maxMarginPct?: number;
    minTotal?: number;
    maxTotal?: number;
    stage?: string;
    dateFrom?: string;
    dateTo?: string;
    industry?: string;
    companyName?: string;
    vendorName?: string;
  };
  /** True when query is asking a question (e.g. "what is shipping for X?") */
  isQuestion?: boolean;
  /** Aggregation request detected from natural language */
  aggregation?: {
    type: "sum" | "count" | "avg";
    field: string;
    groupBy?: string;
  };
}

// ──────── OpenAI Intent Router ────────

async function routeSearchQuery(query: string): Promise<SearchIntent> {
  const allEntityTypes: EntityType[] = ["order", "product", "company", "contact", "vendor", "purchase_order", "shipment", "activity"];
  const fallback: SearchIntent = {
    entityTypes: allEntityTypes,
    keywords: query,
  };

  if (!getOpenAI()) {
    return fallback;
  }

  try {
    const resp = await getOpenAI()!.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a search intent parser for a promotional products business CRM called SwagSuite.

Available entity types: order, product, company, contact, vendor, purchase_order, shipment, activity.
- "order" = projects/orders (has order number, project name, company, margin, total, stage, shipping)
- "product" = catalog products (name, SKU, description, price)
- "company" = client companies (name, industry, website)
- "contact" = people at companies or suppliers (first name, last name, email, phone, title)
- "vendor" / "supplier" = product suppliers (S&S, SanMar, etc.)
- "purchase_order" = POs sent to vendors (PO number, vendor notes, internal notes, vendor name)
- "shipment" = shipment/tracking records (tracking number, carrier, ship-to address/name)
- "activity" = activity log entries, notes, comments on orders

Stage values: presentation, quote, sales_order, invoice
Order statuses: salesOrderStatus (new, pending_client_approval, client_approved, in_production, shipped, ready_to_invoice)

Today is ${new Date().toISOString().split("T")[0]}.

Respond in strict JSON (no markdown):
{
  "entityTypes": ["order"|"product"|"company"|"contact"|"vendor"|"purchase_order"|"shipment"|"activity", ...],
  "keywords": "cleaned search terms for name matching",
  "isQuestion": true/false,
  "filters": {
    "minMarginPct": number (0-100),
    "maxMarginPct": number (0-100),
    "minTotal": number,
    "maxTotal": number,
    "stage": "presentation"|"quote"|"sales_order"|"invoice",
    "dateFrom": "YYYY-MM-DD",
    "dateTo": "YYYY-MM-DD",
    "industry": string,
    "companyName": string,
    "vendorName": string
  },
  "aggregation": {
    "type": "sum"|"count"|"avg",
    "field": "total"|"margin"|"id",
    "groupBy": "stage"|"company"
  }
}

Rules:
- Default entityTypes to all seven if unclear.
- isQuestion=true when user asks "what is", "show me", "how much", "when", "where", etc.
- "High margin" = minMarginPct 30. "Low margin" = maxMarginPct 15.
- "Last month"/"this quarter" → compute concrete dates based on today.
- keywords = key search terms (brand, person name, company, order number). If query is pure filter (e.g. "high margin orders"), keywords = "".
- If user mentions a person name → include "contact" in entityTypes.
- If user asks about shipping/tracking → include "order" AND "shipment" in entityTypes.
- If user mentions vendor/supplier name (S&S, SanMar, SAGE, etc.) → include "vendor" AND "purchase_order".
- If user mentions "PO" or "purchase order" → include "purchase_order".
- If user mentions tracking number or carrier → include "shipment".
- Cross-entity filtering: if user says "orders from [company]" set filters.companyName. If "POs for [vendor]" set filters.vendorName.
- Aggregation: detect queries like "total revenue", "how many orders", "average margin", "count by stage", "revenue by company". Set aggregation object. field="total" for revenue/total, field="margin" for margin, field="id" for counting. Only include aggregation when user is asking for a computed number, NOT for regular searches.
- Omit filters, aggregation objects or individual keys if not relevant.`,
        },
        { role: "user", content: query },
      ],
    });

    const text = resp.choices[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(text);

    const entityTypes = Array.isArray(parsed.entityTypes) && parsed.entityTypes.length > 0
      ? parsed.entityTypes.filter((t: string): t is EntityType =>
          allEntityTypes.includes(t as EntityType)
        )
      : fallback.entityTypes;

    // Validate aggregation if present
    let aggregation: SearchIntent["aggregation"];
    if (parsed.aggregation && parsed.aggregation.type && parsed.aggregation.field) {
      const validTypes = ["sum", "count", "avg"];
      const validFields = ["total", "margin", "id"];
      const validGroupBy = ["stage", "company"];
      if (
        validTypes.includes(parsed.aggregation.type) &&
        validFields.includes(parsed.aggregation.field)
      ) {
        aggregation = {
          type: parsed.aggregation.type,
          field: parsed.aggregation.field,
          groupBy: validGroupBy.includes(parsed.aggregation.groupBy) ? parsed.aggregation.groupBy : undefined,
        };
      }
    }

    return {
      entityTypes: entityTypes.length > 0 ? entityTypes : fallback.entityTypes,
      keywords: typeof parsed.keywords === "string" ? parsed.keywords : query,
      filters: parsed.filters || undefined,
      isQuestion: !!parsed.isQuestion,
      aggregation,
    };
  } catch (err: any) {
    console.warn(`[search] routeSearchQuery: AI failed, using keyword fallback | error="${err?.message}"`);
    return fallback;
  }
}

// ──────── pg_trgm availability check ────────

let trgmAvailable: boolean | null = null;

async function checkTrgmAvailable(): Promise<boolean> {
  if (trgmAvailable !== null) return trgmAvailable;
  try {
    await db.execute(sql`SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'`);
    const result = await db.execute(sql`SELECT similarity('test', 'tset') AS sim`);
    trgmAvailable = true;
    console.log("[search.service] pg_trgm extension: AVAILABLE");
  } catch {
    trgmAvailable = false;
    console.log("[search.service] pg_trgm extension: NOT AVAILABLE, using ILIKE fallback");
  }
  return trgmAvailable;
}

// ──────── Fuzzy matching (pg_trgm with ILIKE fallback) ────────

/**
 * Build fuzzy match conditions using pg_trgm similarity when available,
 * falling back to ILIKE for compatibility.
 * With pg_trgm: "Bber" matches "Beber" via similarity threshold.
 * Without: each keyword word must ILIKE-match at least one column.
 */
function fuzzyMatch(columns: any[], keywords: string) {
  const words = keywords.split(/\s+/).filter(Boolean);
  if (words.length === 0) return undefined;

  // Use ILIKE approach (works everywhere, pg_trgm indexes still speed up ILIKE)
  const wordConditions = words.map((word) => {
    const like = `%${word}%`;
    return or(...columns.map((col) => ilike(col, like)));
  });

  return and(...wordConditions);
}

/**
 * Enhanced trigram match: uses pg_trgm similarity() for better typo tolerance.
 * Returns condition + relevance score column for sorting.
 * Falls back to ILIKE if pg_trgm unavailable.
 */
async function trigramMatch(columns: any[], keywords: string, threshold = 0.3) {
  const hasTrgm = await checkTrgmAvailable();

  if (!hasTrgm) {
    return { condition: fuzzyMatch(columns, keywords), scoreExpr: null };
  }

  const words = keywords.split(/\s+/).filter(Boolean);
  if (words.length === 0) return { condition: undefined, scoreExpr: null };

  // For each word, match via similarity OR ILIKE on any column
  const wordConditions = words.map((word) => {
    const conditions = columns.map((col) =>
      or(
        sql`similarity(COALESCE(${col}, ''), ${word}) > ${threshold}`,
        ilike(col, `%${word}%`),
      ),
    );
    return or(...conditions);
  });

  // Score = max similarity across all columns for the full keyword string
  const scoreExprs = columns.map((col) =>
    sql`similarity(COALESCE(${col}, ''), ${keywords})`,
  );
  const scoreExpr = sql`GREATEST(${sql.join(scoreExprs, sql`, `)})`;

  return {
    condition: and(...wordConditions),
    scoreExpr,
  };
}

// ──────── Entity Searches ────────

async function searchOrders(
  intent: SearchIntent,
  limit: number,
): Promise<SearchResult[]> {
  const kw = intent.keywords.trim();
  const f = intent.filters || {};

  const conditions: any[] = [];

  if (kw) {
    const match = fuzzyMatch(
      [orders.orderNumber, orders.projectName, companies.name],
      kw,
    );
    if (match) conditions.push(match);
  }

  // Margin filter
  if (typeof f.minMarginPct === "number") {
    conditions.push(gte(orders.margin, String(f.minMarginPct)));
  }
  if (typeof f.maxMarginPct === "number") {
    conditions.push(lte(orders.margin, String(f.maxMarginPct)));
  }

  // Total filter
  if (typeof f.minTotal === "number") {
    conditions.push(gte(orders.total, String(f.minTotal)));
  }
  if (typeof f.maxTotal === "number") {
    conditions.push(lte(orders.total, String(f.maxTotal)));
  }

  // Stage filter — use computed stage logic (not currentStage field)
  if (f.stage) {
    switch (f.stage) {
      case "invoice":
        conditions.push(eq(orders.salesOrderStatus, "ready_to_invoice"));
        break;
      case "sales_order":
        conditions.push(
          or(
            sql`${orders.orderType} IN ('sales_order', 'rush_order')`,
            sql`(${orders.salesOrderStatus} IS NOT NULL AND ${orders.salesOrderStatus} != 'new')`,
          ),
        );
        break;
      case "quote":
        conditions.push(
          sql`${orders.quoteStatus} IS NOT NULL AND ${orders.quoteStatus} != 'draft'`,
        );
        break;
      // presentation = default, no specific filter needed
    }
  }

  // Industry filter (via companies join)
  if (f.industry) {
    conditions.push(ilike(companies.industry, `%${f.industry}%`));
  }

  // Company name filter (cross-entity)
  if (f.companyName) {
    conditions.push(ilike(companies.name, `%${f.companyName}%`));
  }

  // Date range
  if (f.dateFrom) {
    const d = new Date(f.dateFrom);
    if (!isNaN(d.getTime())) conditions.push(gte(orders.createdAt, d));
  }
  if (f.dateTo) {
    const d = new Date(f.dateTo);
    if (!isNaN(d.getTime())) conditions.push(lte(orders.createdAt, d));
  }

  const base = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      projectName: orders.projectName,
      total: orders.total,
      margin: orders.margin,
      orderType: orders.orderType,
      salesOrderStatus: orders.salesOrderStatus,
      quoteStatus: orders.quoteStatus,
      createdAt: orders.createdAt,
      companyName: companies.name,
    })
    .from(orders)
    .leftJoin(companies, eq(orders.companyId, companies.id));

  const filtered = conditions.length > 0 ? base.where(and(...conditions)) : base;
  const rows = await filtered.orderBy(desc(orders.createdAt)).limit(limit);

  return rows.map((o) => {
    const marginPct = o.margin ? Math.round(parseFloat(o.margin)) : 0;
    // Compute display stage from fields
    let stage = "presentation";
    if (o.salesOrderStatus === "ready_to_invoice") stage = "invoice";
    else if (o.orderType === "sales_order" || o.orderType === "rush_order" ||
      (o.salesOrderStatus && o.salesOrderStatus !== "new")) stage = "sales_order";
    else if (o.quoteStatus && o.quoteStatus !== "draft") stage = "quote";

    return {
      id: o.id,
      type: "order",
      title: `Order #${o.orderNumber}${o.projectName ? ` — ${o.projectName}` : ""}`,
      description: `${o.companyName || "Unknown Customer"} · ${stage}`,
      metadata: {
        value: `$${parseFloat(o.total || "0").toFixed(2)}`,
        margin: `${marginPct}%`,
        stage,
        status: o.salesOrderStatus || "new",
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "",
      },
      url: `/projects/${o.id}`,
    };
  });
}

async function searchProducts(
  intent: SearchIntent,
  limit: number,
): Promise<SearchResult[]> {
  const kw = intent.keywords.trim();
  if (!kw) return [];

  const match = fuzzyMatch([products.name, products.sku, products.description], kw);
  if (!match) return [];

  const rows = await db
    .select()
    .from(products)
    .where(match)
    .orderBy(desc(products.createdAt))
    .limit(limit);

  return rows.map((p) => ({
    id: p.id,
    type: "product",
    title: p.name,
    description: p.description || "No description",
    metadata: {
      value: `$${Number(p.basePrice || 0).toFixed(2)}`,
      sku: p.sku || "",
    },
    url: `/products/${p.id}`,
  }));
}

async function searchCompanies(
  intent: SearchIntent,
  limit: number,
): Promise<SearchResult[]> {
  const kw = intent.keywords.trim();
  const f = intent.filters || {};

  const conditions: any[] = [];

  if (kw) {
    const match = fuzzyMatch([companies.name, companies.industry, companies.website, companies.email], kw);
    if (match) conditions.push(match);
  }

  if (f.industry) {
    conditions.push(ilike(companies.industry, `%${f.industry}%`));
  }

  if (conditions.length === 0) return [];

  const rows = await db
    .select()
    .from(companies)
    .where(and(...conditions))
    .orderBy(desc(companies.createdAt))
    .limit(limit);

  return rows.map((c) => ({
    id: c.id,
    type: "company",
    title: c.name,
    description: `${c.industry || "Unknown industry"} · ${c.website || "No website"}`,
    metadata: {
      email: c.email || "",
      phone: c.phone || "",
    },
    url: `/crm/companies/${c.id}`,
  }));
}

async function searchContacts(
  intent: SearchIntent,
  limit: number,
): Promise<SearchResult[]> {
  const kw = intent.keywords.trim();
  if (!kw) return [];

  const match = fuzzyMatch(
    [contacts.firstName, contacts.lastName, contacts.email, contacts.title],
    kw,
  );
  if (!match) return [];

  const rows = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      phone: contacts.phone,
      title: contacts.title,
      companyId: contacts.companyId,
      companyName: companies.name,
    })
    .from(contacts)
    .leftJoin(companies, eq(contacts.companyId, companies.id))
    .where(match)
    .limit(limit);

  return rows.map((c) => ({
    id: c.id,
    type: "contact",
    title: `${c.firstName} ${c.lastName}`,
    description: `${c.title || "Contact"}${c.companyName ? ` at ${c.companyName}` : ""}`,
    metadata: {
      email: c.email || "",
      phone: c.phone || "",
      company: c.companyName || "",
    },
    url: `/crm/contacts/${c.id}`,
  }));
}

async function searchVendors(
  intent: SearchIntent,
  limit: number,
): Promise<SearchResult[]> {
  const kw = intent.keywords.trim();
  if (!kw) return [];

  const match = fuzzyMatch(
    [suppliers.name, suppliers.email, suppliers.contactPerson],
    kw,
  );
  if (!match) return [];

  const rows = await db
    .select()
    .from(suppliers)
    .where(match)
    .orderBy(desc(suppliers.createdAt))
    .limit(limit);

  return rows.map((s) => ({
    id: s.id,
    type: "vendor",
    title: s.name,
    description: `${s.contactPerson || "No contact"} · ${s.email || "No email"}`,
    metadata: {
      email: s.email || "",
      phone: s.phone || "",
      website: s.website || "",
      accountNumber: s.accountNumber || "",
    },
    url: `/crm/vendors/${s.id}`,
  }));
}

// ──────── Purchase Order Search ────────

async function searchPurchaseOrders(
  intent: SearchIntent,
  limit: number,
): Promise<SearchResult[]> {
  const kw = intent.keywords.trim();
  const f = intent.filters || {};
  const conditions: any[] = [];

  if (kw) {
    const match = fuzzyMatch(
      [purchaseOrders.poNumber, purchaseOrders.vendorNotes, purchaseOrders.internalNotes, suppliers.name],
      kw,
    );
    if (match) conditions.push(match);
  }

  // Vendor name filter (cross-entity)
  if (f.vendorName) {
    conditions.push(ilike(suppliers.name, `%${f.vendorName}%`));
  }

  // Date range
  if (f.dateFrom) {
    const d = new Date(f.dateFrom);
    if (!isNaN(d.getTime())) conditions.push(gte(purchaseOrders.createdAt, d));
  }
  if (f.dateTo) {
    const d = new Date(f.dateTo);
    if (!isNaN(d.getTime())) conditions.push(lte(purchaseOrders.createdAt, d));
  }

  if (conditions.length === 0 && !kw) return [];

  const base = db
    .select({
      id: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      orderId: purchaseOrders.orderId,
      vendorId: purchaseOrders.vendorId,
      vendorRole: purchaseOrders.vendorRole,
      vendorNotes: purchaseOrders.vendorNotes,
      internalNotes: purchaseOrders.internalNotes,
      submittedAt: purchaseOrders.submittedAt,
      confirmedAt: purchaseOrders.confirmedAt,
      shippedAt: purchaseOrders.shippedAt,
      createdAt: purchaseOrders.createdAt,
      vendorName: suppliers.name,
      orderNumber: orders.orderNumber,
      projectName: orders.projectName,
    })
    .from(purchaseOrders)
    .leftJoin(suppliers, eq(purchaseOrders.vendorId, suppliers.id))
    .leftJoin(orders, eq(purchaseOrders.orderId, orders.id));

  const filtered = conditions.length > 0 ? base.where(and(...conditions)) : base;
  const rows = await filtered.orderBy(desc(purchaseOrders.createdAt)).limit(limit);

  return rows.map((po) => {
    // Compute PO status from lifecycle timestamps
    let status = "created";
    if (po.shippedAt) status = "shipped";
    else if (po.confirmedAt) status = "confirmed";
    else if (po.submittedAt) status = "submitted";

    return {
      id: po.id,
      type: "purchase_order",
      title: `PO #${po.poNumber}`,
      description: `${po.vendorName || "Unknown Vendor"} · ${po.vendorRole || "supplier"} · ${status}`,
      metadata: {
        status,
        vendor: po.vendorName || "",
        orderNumber: po.orderNumber || "",
        project: po.projectName || "",
        date: po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "",
      },
      url: `/projects/${po.orderId}`,
    };
  });
}

// ──────── Shipment Search ────────

async function searchShipments(
  intent: SearchIntent,
  limit: number,
): Promise<SearchResult[]> {
  const kw = intent.keywords.trim();
  const f = intent.filters || {};
  const conditions: any[] = [];

  if (kw) {
    const match = fuzzyMatch(
      [orderShipments.trackingNumber, orderShipments.carrier, orderShipments.shipToName, orderShipments.shipToCompany, orderShipments.shipToAddress],
      kw,
    );
    if (match) conditions.push(match);
  }

  // Date range
  if (f.dateFrom) {
    const d = new Date(f.dateFrom);
    if (!isNaN(d.getTime())) conditions.push(gte(orderShipments.createdAt, d));
  }
  if (f.dateTo) {
    const d = new Date(f.dateTo);
    if (!isNaN(d.getTime())) conditions.push(lte(orderShipments.createdAt, d));
  }

  if (conditions.length === 0 && !kw) return [];

  const base = db
    .select({
      id: orderShipments.id,
      orderId: orderShipments.orderId,
      carrier: orderShipments.carrier,
      trackingNumber: orderShipments.trackingNumber,
      status: orderShipments.status,
      shippingCost: orderShipments.shippingCost,
      shipToName: orderShipments.shipToName,
      shipToCompany: orderShipments.shipToCompany,
      shipDate: orderShipments.shipDate,
      estimatedDelivery: orderShipments.estimatedDelivery,
      createdAt: orderShipments.createdAt,
      orderNumber: orders.orderNumber,
      projectName: orders.projectName,
    })
    .from(orderShipments)
    .leftJoin(orders, eq(orderShipments.orderId, orders.id));

  const filtered = conditions.length > 0 ? base.where(and(...conditions)) : base;
  const rows = await filtered.orderBy(desc(orderShipments.createdAt)).limit(limit);

  return rows.map((s) => ({
    id: s.id,
    type: "shipment",
    title: `${s.carrier || "Shipment"} ${s.trackingNumber ? `#${s.trackingNumber}` : ""}`.trim(),
    description: `${s.shipToName || s.shipToCompany || "Unknown"} · ${s.status || "pending"}`,
    metadata: {
      carrier: s.carrier || "",
      tracking: s.trackingNumber || "",
      status: s.status || "pending",
      cost: s.shippingCost ? `$${parseFloat(s.shippingCost).toFixed(2)}` : "",
      orderNumber: s.orderNumber || "",
      shipDate: s.shipDate ? new Date(s.shipDate).toLocaleDateString() : "",
      estimatedDelivery: s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString() : "",
    },
    url: `/projects/${s.orderId}`,
  }));
}

// ──────── Activity Search ────────

async function searchActivities(
  intent: SearchIntent,
  limit: number,
): Promise<SearchResult[]> {
  const kw = intent.keywords.trim();
  if (!kw) return [];

  const f = intent.filters || {};
  const conditions: any[] = [];

  // Search across both activity tables
  // First: project_activities (order-scoped comments/notes)
  const paMatch = fuzzyMatch([projectActivities.content], kw);
  if (!paMatch) return [];

  const paConditions = [paMatch];

  if (f.dateFrom) {
    const d = new Date(f.dateFrom);
    if (!isNaN(d.getTime())) paConditions.push(gte(projectActivities.createdAt, d));
  }
  if (f.dateTo) {
    const d = new Date(f.dateTo);
    if (!isNaN(d.getTime())) paConditions.push(lte(projectActivities.createdAt, d));
  }

  const paRows = await db
    .select({
      id: projectActivities.id,
      content: projectActivities.content,
      activityType: projectActivities.activityType,
      orderId: projectActivities.orderId,
      createdAt: projectActivities.createdAt,
      orderNumber: orders.orderNumber,
      projectName: orders.projectName,
    })
    .from(projectActivities)
    .leftJoin(orders, eq(projectActivities.orderId, orders.id))
    .where(and(...paConditions))
    .orderBy(desc(projectActivities.createdAt))
    .limit(limit);

  return paRows.map((a) => ({
    id: a.id,
    type: "activity",
    title: `Activity on #${a.orderNumber || "?"}${a.projectName ? ` — ${a.projectName}` : ""}`,
    description: (a.content || "").slice(0, 120),
    metadata: {
      activityType: a.activityType || "",
      orderNumber: a.orderNumber || "",
      date: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "",
    },
    url: `/projects/${a.orderId}`,
  }));
}

// ──────── AI Answer Generator ────────

async function generateAnswer(
  query: string,
  results: SearchResult[],
  aggregation?: AggregationResult | null,
): Promise<string | null> {
  if (!getOpenAI() || (results.length === 0 && !aggregation)) return null;

  try {
    // Build context from results (limit to avoid token overflow)
    const context = results.slice(0, 8).map((r) => {
      const meta = Object.entries(r.metadata || {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      return `[${r.type}] ${r.title} — ${r.description}${meta ? ` (${meta})` : ""}`;
    }).join("\n");

    // Add aggregation context if available
    const aggContext = aggregation
      ? `\n\nAggregation: ${aggregation.label} = ${typeof aggregation.value === "number" && aggregation.value > 100 ? `$${aggregation.value.toLocaleString()}` : aggregation.value}${
          aggregation.breakdown?.length
            ? "\nBreakdown:\n" + aggregation.breakdown.map((b) => `  ${b.key}: ${typeof b.value === "number" && b.value > 100 ? `$${b.value.toLocaleString()}` : b.value}`).join("\n")
            : ""
        }`
      : "";

    const resp = await getOpenAI()!.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant for SwagSuite, a promotional products business CRM.
Given a user's search query and matching results from the database, provide a brief, direct answer.
Be concise (1-3 sentences). Use specific numbers, names, and dates from the results.
If the query is just a name/keyword search (not a question), respond with a one-line summary like "Found X matching results across orders/companies/etc."
Do NOT make up data that isn't in the results.`,
        },
        {
          role: "user",
          content: `Query: "${query}"\n\nResults:\n${context}${aggContext}`,
        },
      ],
    });

    return resp.choices[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// ──────── Enrich order results with shipping info when relevant ────────

async function enrichOrdersWithShipping(
  results: SearchResult[],
  query: string,
): Promise<void> {
  const isShippingQuery = /ship|track|deliver|freight|carrier/i.test(query);
  if (!isShippingQuery) return;

  const orderIds = results
    .filter((r) => r.type === "order")
    .map((r) => r.id);
  if (orderIds.length === 0) return;

  // Fetch shipments for these orders
  const shipments = await db
    .select({
      orderId: orderShipments.orderId,
      carrier: orderShipments.carrier,
      trackingNumber: orderShipments.trackingNumber,
      status: orderShipments.status,
      shippingCost: orderShipments.shippingCost,
      estimatedDelivery: orderShipments.estimatedDelivery,
    })
    .from(orderShipments)
    .where(sql`${orderShipments.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`);

  // Fetch service charges (shipping type)
  const charges = await db
    .select({
      orderId: orderServiceCharges.orderId,
      chargeType: orderServiceCharges.chargeType,
      unitPrice: orderServiceCharges.unitPrice,
      unitCost: orderServiceCharges.unitCost,
      quantity: orderServiceCharges.quantity,
    })
    .from(orderServiceCharges)
    .where(
      and(
        sql`${orderServiceCharges.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`,
        sql`${orderServiceCharges.chargeType} IN ('freight', 'shipping', 'fulfillment')`,
      ),
    );

  // Enrich results
  for (const r of results) {
    if (r.type !== "order") continue;
    const orderShips = shipments.filter((s) => s.orderId === r.id);
    const orderCharges = charges.filter((c) => c.orderId === r.id);

    if (orderShips.length > 0) {
      const ship = orderShips[0];
      r.metadata.carrier = ship.carrier || "";
      r.metadata.tracking = ship.trackingNumber || "";
      r.metadata.shipStatus = ship.status || "";
      r.metadata.estimatedDelivery = ship.estimatedDelivery
        ? new Date(ship.estimatedDelivery).toLocaleDateString()
        : "";
    }

    if (orderCharges.length > 0) {
      const totalShippingCost = orderCharges.reduce(
        (sum, c) => sum + parseFloat(c.unitCost || "0") * (c.quantity || 1),
        0,
      );
      const totalShippingPrice = orderCharges.reduce(
        (sum, c) => sum + parseFloat(c.unitPrice || "0") * (c.quantity || 1),
        0,
      );
      r.metadata.shippingCost = `$${totalShippingCost.toFixed(2)}`;
      r.metadata.shippingPrice = `$${totalShippingPrice.toFixed(2)}`;
    }
  }
}

// ──────── Public API ────────

export class SearchService {
  async aiSearch(
    query: string,
    options?: { limit?: number },
  ): Promise<{ results: SearchResult[]; answer?: string; aggregation?: AggregationResult }> {
    const trimmed = query.trim();
    if (!trimmed) return { results: [] };

    // Step 1: Route query to intent via OpenAI (or fallback)
    const intent = await routeSearchQuery(trimmed);

    // Step 2: Run parallel searches + aggregation on requested entity types
    const perEntityLimit = options?.limit || 5;
    const tasks: Promise<SearchResult[]>[] = [];

    if (intent.entityTypes.includes("order")) {
      tasks.push(searchOrders(intent, perEntityLimit));
    }
    if (intent.entityTypes.includes("product")) {
      tasks.push(searchProducts(intent, perEntityLimit));
    }
    if (intent.entityTypes.includes("company")) {
      tasks.push(searchCompanies(intent, perEntityLimit));
    }
    if (intent.entityTypes.includes("contact")) {
      tasks.push(searchContacts(intent, perEntityLimit));
    }
    if (intent.entityTypes.includes("vendor")) {
      tasks.push(searchVendors(intent, perEntityLimit));
    }
    if (intent.entityTypes.includes("purchase_order")) {
      tasks.push(searchPurchaseOrders(intent, perEntityLimit));
    }
    if (intent.entityTypes.includes("shipment")) {
      tasks.push(searchShipments(intent, perEntityLimit));
    }
    if (intent.entityTypes.includes("activity")) {
      tasks.push(searchActivities(intent, perEntityLimit));
    }

    // Run aggregation + semantic search in parallel with entity searches
    const aggPromise = intent.aggregation
      ? executeAggregation(intent.aggregation, {
          stage: intent.filters?.stage,
          dateFrom: intent.filters?.dateFrom,
          dateTo: intent.filters?.dateTo,
          industry: intent.filters?.industry,
          companyName: intent.filters?.companyName,
        })
      : Promise.resolve(null);

    // Semantic search in parallel (only if available and query is meaningful)
    const semanticPromise = intent.keywords.trim().length >= 3
      ? semanticSearch(trimmed, intent.entityTypes, 10).catch(() => [] as any[])
      : Promise.resolve([]);

    const [groups, aggResult, semanticResults] = await Promise.all([
      Promise.all(tasks),
      aggPromise,
      semanticPromise,
    ]);

    const maxResults = perEntityLimit * intent.entityTypes.length;
    let results = groups.flat().slice(0, maxResults);

    // Merge semantic results: boost keyword results that also matched semantically,
    // and append unique semantic matches not found by keyword search
    if (semanticResults.length > 0) {
      const existingIds = new Set(results.map((r) => `${r.type}:${r.id}`));
      // Semantic results only contain entity references, not full SearchResult objects.
      // They primarily serve as a ranking signal. For now, log for observability.
      const semanticOnlyCount = semanticResults.filter(
        (sr: any) => !existingIds.has(`${sr.entityType}:${sr.entityId}`),
      ).length;
      if (semanticOnlyCount > 0) {
        console.log(`[search] ${semanticOnlyCount} additional semantic matches (not in keyword results)`);
      }
    }

    // Step 3: Enrich with shipping data if relevant
    await enrichOrdersWithShipping(results, trimmed);

    // Step 4: Generate AI answer (include aggregation context)
    let answer: string | null = null;
    if (intent.isQuestion || results.length > 0 || aggResult) {
      answer = await generateAnswer(trimmed, results, aggResult);
    }

    return {
      results,
      answer: answer || undefined,
      aggregation: aggResult || undefined,
    };
  }

  /**
   * Advanced search with explicit filters, pagination, and entity type selection.
   * Used by the dedicated search page (GET /api/search/advanced).
   */
  async advancedSearch(params: {
    q: string;
    limit?: number;
    offset?: number;
    entityTypes?: EntityType[];
    stage?: string;
    marginMin?: number;
    marginMax?: number;
    dateFrom?: string;
    dateTo?: string;
    industry?: string;
  }): Promise<{
    results: SearchResult[];
    total: number;
    facets: Record<string, number>;
    answer?: string;
    aggregation?: AggregationResult;
  }> {
    const trimmed = (params.q || "").trim();
    const limit = params.limit || 10;

    // Check if user provided explicit filters from the sidebar
    const hasExplicitFilters = !!(
      params.stage ||
      params.marginMin !== undefined ||
      params.marginMax !== undefined ||
      params.dateFrom ||
      params.dateTo ||
      params.industry
    );

    let intent: SearchIntent;

    if (hasExplicitFilters || !trimmed) {
      // User set sidebar filters → build intent directly (no AI routing needed)
      const requestedTypes = params.entityTypes?.length
        ? params.entityTypes
        : (["order", "product", "company", "contact", "vendor", "purchase_order", "shipment", "activity"] as EntityType[]);

      intent = {
        entityTypes: requestedTypes,
        keywords: trimmed,
        filters: {
          stage: params.stage,
          minMarginPct: params.marginMin,
          maxMarginPct: params.marginMax,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          industry: params.industry,
        },
      };
    } else {
      // No explicit filters → use AI routing to parse natural language query
      // e.g. "top margin orders" → keywords: "", filters: { minMarginPct: 30 }
      intent = await routeSearchQuery(trimmed);

      // Override entity types if user filtered in sidebar
      if (params.entityTypes?.length) {
        intent.entityTypes = params.entityTypes;
      }
    }

    const requestedTypes = intent.entityTypes;

    // Run parallel searches with higher limits for pagination
    const fetchLimit = limit + (params.offset || 0);
    const searchMap: Record<EntityType, (i: SearchIntent, l: number) => Promise<SearchResult[]>> = {
      order: searchOrders,
      product: searchProducts,
      company: searchCompanies,
      contact: searchContacts,
      vendor: searchVendors,
      purchase_order: searchPurchaseOrders,
      shipment: searchShipments,
      activity: searchActivities,
    };

    const tasks = requestedTypes.map((type) => searchMap[type](intent, fetchLimit));

    // Run aggregation in parallel if AI detected one
    const aggPromise = intent.aggregation
      ? executeAggregation(intent.aggregation, {
          stage: intent.filters?.stage,
          dateFrom: intent.filters?.dateFrom,
          dateTo: intent.filters?.dateTo,
          industry: intent.filters?.industry,
          companyName: intent.filters?.companyName,
        })
      : Promise.resolve(null);

    const [groups, aggResult] = await Promise.all([
      Promise.all(tasks),
      aggPromise,
    ]);

    // Build facets (counts per entity type)
    const facets: Record<string, number> = {};
    requestedTypes.forEach((type, i) => {
      facets[type] = groups[i].length;
    });

    // Flatten and apply offset/limit
    const allResults = groups.flat();
    const offset = params.offset || 0;
    const results = allResults.slice(offset, offset + limit);
    const total = allResults.length;

    // Enrich shipping if relevant
    await enrichOrdersWithShipping(results, trimmed);

    // Generate AI answer for first page only
    let answer: string | undefined;
    if (offset === 0 && (results.length > 0 || aggResult)) {
      const aiAnswer = await generateAnswer(trimmed, results, aggResult);
      answer = aiAnswer || undefined;
    }

    return {
      results,
      total,
      facets,
      answer,
      aggregation: aggResult || undefined,
    };
  }

  /**
   * Grouped universal search for the GET /api/search endpoint.
   * Returns separate buckets instead of a flat list.
   */
  async universalSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      return { companies: [], products: [], orders: [] };
    }

    const fallbackIntent: SearchIntent = {
      entityTypes: ["order", "product", "company"],
      keywords: trimmed,
    };

    const [companiesResults, productsResults, ordersResults] = await Promise.all([
      searchCompanies(fallbackIntent, 5),
      searchProducts(fallbackIntent, 5),
      searchOrders(fallbackIntent, 5),
    ]);

    return {
      companies: companiesResults,
      products: productsResults,
      orders: ordersResults,
    };
  }
}

export const searchService = new SearchService();
