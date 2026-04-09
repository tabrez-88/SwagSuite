import OpenAI from "openai";
import { and, desc, eq, gte, lte, ilike, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  orders,
  products,
  companies,
} from "@shared/schema";
import { companyRepository } from "../repositories/company.repository";
import { productRepository } from "../repositories/product.repository";

// ──────── OpenAI Client ────────

const openai = process.env.OPENAI_API_KEY?.trim()
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim() })
  : null;

// ──────── Types ────────

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  url: string;
}

type EntityType = "order" | "product" | "company";

interface SearchIntent {
  /** Entity types the user is asking about */
  entityTypes: EntityType[];
  /** Cleaned-up keyword string (brand name, person name, etc.) */
  keywords: string;
  /** Optional structured filters */
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
}

// ──────── OpenAI Intent Router ────────

async function routeSearchQuery(query: string): Promise<SearchIntent> {
  // Default: search all entities with the raw query as keywords
  const fallback: SearchIntent = {
    entityTypes: ["order", "product", "company"],
    keywords: query,
  };

  if (!openai) return fallback;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 250,
      messages: [
        {
          role: "system",
          content: `You translate natural language search queries for a promo products business CRM into structured JSON intent.

Available entity types: order, product, company.
Fields you can filter on:
- orders: currentStage (presentation|quote|sales_order|invoice), total, margin (0-1 decimal, e.g. 0.3 = 30%), createdAt
- companies: industry
- products: no extra filters (just keywords)

Today is ${new Date().toISOString().split("T")[0]}.

Respond in strict JSON (no markdown):
{
  "entityTypes": ["order"|"product"|"company", ...],
  "keywords": "cleaned keyword string for name/SKU/number matching",
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
- Default entityTypes to all three if unclear.
- Omit filters object or individual keys if not specified.
- "High margin" = minMarginPct 30. "Low margin" = maxMarginPct 15.
- "Last month" / "this quarter" → compute concrete dates.
- keywords should be 1-3 words extracted from query (brand, person, number). If query is pure filter (e.g. "high margin orders"), keywords = "".`,
        },
        { role: "user", content: query },
      ],
    });

    const text = resp.choices[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(text);

    const entityTypes = Array.isArray(parsed.entityTypes) && parsed.entityTypes.length > 0
      ? parsed.entityTypes.filter((t: string): t is EntityType =>
          t === "order" || t === "product" || t === "company"
        )
      : fallback.entityTypes;

    return {
      entityTypes: entityTypes.length > 0 ? entityTypes : fallback.entityTypes,
      keywords: typeof parsed.keywords === "string" ? parsed.keywords : query,
      filters: parsed.filters || undefined,
    };
  } catch {
    return fallback;
  }
}

// ──────── Entity Searches ────────

async function searchOrders(
  intent: SearchIntent,
  limit: number,
): Promise<SearchResult[]> {
  const kw = intent.keywords.trim();
  const f = intent.filters || {};

  const conditions: any[] = [];

  // Keyword match: order number / project name / company name
  if (kw) {
    const like = `%${kw}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, like),
        ilike(orders.projectName, like),
        ilike(companies.name, like),
      ),
    );
  }

  // Margin filter — orders.margin is decimal percentage (0-100, e.g. "30.00" = 30%)
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

  // Stage filter
  if (f.stage) {
    conditions.push(eq(orders.currentStage, f.stage as any));
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
      currentStage: orders.currentStage,
      createdAt: orders.createdAt,
      companyName: companies.name,
    })
    .from(orders)
    .leftJoin(companies, eq(orders.companyId, companies.id));

  const filtered = conditions.length > 0 ? base.where(and(...conditions)) : base;
  const rows = await filtered.orderBy(desc(orders.createdAt)).limit(limit);

  return rows.map((o) => {
    const marginPct = o.margin ? Math.round(parseFloat(o.margin)) : 0;
    return {
      id: o.id,
      type: "order",
      title: `Order #${o.orderNumber}${o.projectName ? ` — ${o.projectName}` : ""}`,
      description: `${o.companyName || "Unknown Customer"} · ${o.currentStage || "draft"}`,
      metadata: {
        value: `$${parseFloat(o.total || "0").toFixed(2)}`,
        margin: `${marginPct}%`,
        stage: o.currentStage || "draft",
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "",
      },
      url: `/project/${o.id}`,
    };
  });
}

async function searchProducts(
  intent: SearchIntent,
  limit: number,
): Promise<SearchResult[]> {
  const kw = intent.keywords.trim();
  if (!kw) {
    // No keyword — return nothing for products (otherwise floods results)
    return [];
  }
  const like = `%${kw}%`;
  const rows = await db
    .select()
    .from(products)
    .where(
      or(
        ilike(products.name, like),
        ilike(products.sku, like),
        ilike(products.description, like),
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(limit);

  return rows.map((p) => ({
    id: p.id,
    type: "product",
    title: p.name,
    description: p.description || "No description available",
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
    const like = `%${kw}%`;
    conditions.push(
      or(
        ilike(companies.name, like),
        ilike(companies.industry, like),
        ilike(companies.website, like),
      ),
    );
  }

  if (f.industry) {
    conditions.push(ilike(companies.industry, `%${f.industry}%`));
  }

  // Skip companies search entirely if no keyword and no industry filter
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

// ──────── Public API ────────

export class SearchService {
  async aiSearch(query: string): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Step 1: Route query to intent via OpenAI (or fallback)
    const intent = await routeSearchQuery(trimmed);

    // Step 2: Run parallel searches on requested entity types
    const perEntityLimit = 4;
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

    const groups = await Promise.all(tasks);
    const results = groups.flat();

    // Step 3: Cap total
    return results.slice(0, 10);
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

    const [companiesResults, productsResults, ordersResults] = await Promise.all([
      companyRepository.search(trimmed),
      productRepository.search(trimmed),
      this.searchOrdersKeyword(trimmed),
    ]);

    return {
      companies: companiesResults.slice(0, 5),
      products: productsResults.slice(0, 5),
      orders: ordersResults.slice(0, 5),
    };
  }

  /** Simple keyword-based orders search used by the grouped endpoint. */
  private async searchOrdersKeyword(query: string) {
    const like = `%${query}%`;
    return db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        projectName: orders.projectName,
        total: orders.total,
        currentStage: orders.currentStage,
        createdAt: orders.createdAt,
        companyId: orders.companyId,
        companyName: companies.name,
      })
      .from(orders)
      .leftJoin(companies, eq(orders.companyId, companies.id))
      .where(
        or(
          ilike(orders.orderNumber, like),
          ilike(orders.projectName, like),
          ilike(companies.name, like),
        ),
      )
      .orderBy(desc(orders.createdAt))
      .limit(20);
  }
}

export const searchService = new SearchService();
