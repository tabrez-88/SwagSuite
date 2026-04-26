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
} from "@shared/schema";
import { suppliers } from "@shared/schema/supplier.schema";

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

type EntityType = "order" | "product" | "company" | "contact" | "vendor";

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
  };
  /** True when query is asking a question (e.g. "what is shipping for X?") */
  isQuestion?: boolean;
}

// ──────── OpenAI Intent Router ────────

async function routeSearchQuery(query: string): Promise<SearchIntent> {
  const fallback: SearchIntent = {
    entityTypes: ["order", "product", "company", "contact", "vendor"],
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

Available entity types: order, product, company, contact, vendor.
- "order" = projects/orders (has order number, project name, company, margin, total, stage, shipping)
- "product" = catalog products (name, SKU, description, price)
- "company" = client companies (name, industry, website)
- "contact" = people at companies or suppliers (first name, last name, email, phone, title)
- "vendor" / "supplier" = product suppliers (S&S, SanMar, etc.)

Stage values: presentation, quote, sales_order, invoice
Order statuses: salesOrderStatus (new, pending_client_approval, client_approved, in_production, shipped, ready_to_invoice)

Today is ${new Date().toISOString().split("T")[0]}.

Respond in strict JSON (no markdown):
{
  "entityTypes": ["order"|"product"|"company"|"contact"|"vendor", ...],
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
    "industry": string
  }
}

Rules:
- Default entityTypes to all five if unclear.
- isQuestion=true when user asks "what is", "show me", "how much", "when", "where", etc.
- "High margin" = minMarginPct 30. "Low margin" = maxMarginPct 15.
- "Last month"/"this quarter" → compute concrete dates based on today.
- keywords = key search terms (brand, person name, company, order number). If query is pure filter (e.g. "high margin orders"), keywords = "".
- If user mentions a person name → include "contact" in entityTypes.
- If user asks about shipping/tracking → include "order" in entityTypes.
- If user mentions vendor/supplier name (S&S, SanMar, SAGE, etc.) → include "vendor".
- Omit filters object or individual keys if not relevant.`,
        },
        { role: "user", content: query },
      ],
    });

    const text = resp.choices[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(text);

    const entityTypes = Array.isArray(parsed.entityTypes) && parsed.entityTypes.length > 0
      ? parsed.entityTypes.filter((t: string): t is EntityType =>
          ["order", "product", "company", "contact", "vendor"].includes(t)
        )
      : fallback.entityTypes;

    return {
      entityTypes: entityTypes.length > 0 ? entityTypes : fallback.entityTypes,
      keywords: typeof parsed.keywords === "string" ? parsed.keywords : query,
      filters: parsed.filters || undefined,
      isQuestion: !!parsed.isQuestion,
    };
  } catch (err: any) {
    console.warn(`[search] routeSearchQuery: AI failed, using keyword fallback | error="${err?.message}"`);
    return fallback;
  }
}

// ──────── Fuzzy ILIKE helper (trigram-like multi-word matching) ────────

/**
 * Build flexible ILIKE conditions: split keywords into words,
 * each word must match at least one of the target columns.
 * This gives "Beber" matching "Beber Silverstein" and
 * "S&S" matching "S&S Activewear" without needing pg_trgm extension.
 */
function fuzzyMatch(columns: any[], keywords: string) {
  const words = keywords.split(/\s+/).filter(Boolean);
  if (words.length === 0) return undefined;

  // Each word must match at least one column
  const wordConditions = words.map((word) => {
    const like = `%${word}%`;
    return or(...columns.map((col) => ilike(col, like)));
  });

  return and(...wordConditions);
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
    url: `/products`,
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
    url: c.companyId ? `/crm/companies/${c.companyId}` : `/crm/contacts`,
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
    url: `/crm/vendors`,
  }));
}

// ──────── AI Answer Generator ────────

async function generateAnswer(
  query: string,
  results: SearchResult[],
): Promise<string | null> {
  if (!getOpenAI() || results.length === 0) return null;

  try {
    // Build context from results (limit to avoid token overflow)
    const context = results.slice(0, 8).map((r) => {
      const meta = Object.entries(r.metadata || {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      return `[${r.type}] ${r.title} — ${r.description}${meta ? ` (${meta})` : ""}`;
    }).join("\n");

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
          content: `Query: "${query}"\n\nResults:\n${context}`,
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
  async aiSearch(query: string): Promise<{ results: SearchResult[]; answer?: string }> {
    const trimmed = query.trim();
    if (!trimmed) return { results: [] };

    // Step 1: Route query to intent via OpenAI (or fallback)
    const intent = await routeSearchQuery(trimmed);

    // Step 2: Run parallel searches on requested entity types
    const perEntityLimit = 5;
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

    const groups = await Promise.all(tasks);
    let results = groups.flat().slice(0, 15);

    // Step 3: Enrich with shipping data if relevant
    await enrichOrdersWithShipping(results, trimmed);

    // Step 4: Generate AI answer
    let answer: string | null = null;
    if (intent.isQuestion || results.length > 0) {
      answer = await generateAnswer(trimmed, results);
    }

    return { results, answer: answer || undefined };
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
