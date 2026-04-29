import OpenAI from "openai";
import { createHash } from "crypto";
import { db } from "../db";
import { sql } from "drizzle-orm";
import {
  orders,
  products,
  companies,
  contacts,
} from "@shared/schema";
import { suppliers } from "@shared/schema/supplier.schema";

// ──────── OpenAI Embedding Client ────────

let embeddingClient: OpenAI | null = null;

function getEmbeddingClient(): OpenAI | null {
  if (!embeddingClient) {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) return null;
    embeddingClient = new OpenAI({ apiKey: key });
  }
  return embeddingClient;
}

// ──────── pgvector availability check ────────

let vectorAvailable: boolean | null = null;

async function checkVectorAvailable(): Promise<boolean> {
  if (vectorAvailable !== null) return vectorAvailable;
  try {
    await db.execute(sql`SELECT 1 FROM pg_extension WHERE extname = 'vector'`);
    await db.execute(sql`SELECT 1 FROM search_embeddings LIMIT 0`);
    vectorAvailable = true;
    console.log("[search.embeddings] pgvector: AVAILABLE");
  } catch {
    vectorAvailable = false;
    console.log("[search.embeddings] pgvector: NOT AVAILABLE, semantic search disabled");
  }
  return vectorAvailable;
}

export async function isSemanticSearchAvailable(): Promise<boolean> {
  return !!(getEmbeddingClient() && (await checkVectorAvailable()));
}

// ──────── Embedding Generation ────────

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const client = getEmbeddingClient();
  if (!client) return null;

  try {
    const resp = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000), // Limit input length
    });
    return resp.data[0]?.embedding || null;
  } catch (err: any) {
    console.error(`[search.embeddings] Error generating embedding: ${err.message}`);
    return null;
  }
}

function contentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

// ──────── Content Templates ────────

interface EntityContent {
  entityType: string;
  entityId: string;
  text: string;
}

async function getOrderContents(limit = 500): Promise<EntityContent[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      projectName: orders.projectName,
      companyName: companies.name,
    })
    .from(orders)
    .leftJoin(companies, sql`${orders.companyId} = ${companies.id}`)
    .limit(limit);

  return rows.map((r) => ({
    entityType: "order",
    entityId: r.id,
    text: `Order #${r.orderNumber} ${r.projectName || ""} for ${r.companyName || "unknown customer"}`,
  }));
}

async function getProductContents(limit = 500): Promise<EntityContent[]> {
  const rows = await db.select().from(products).limit(limit);
  return rows.map((r) => ({
    entityType: "product",
    entityId: r.id,
    text: `Product: ${r.name} ${r.sku ? `SKU ${r.sku}` : ""} ${r.description || ""}`.trim(),
  }));
}

async function getCompanyContents(limit = 500): Promise<EntityContent[]> {
  const rows = await db.select().from(companies).limit(limit);
  return rows.map((r) => ({
    entityType: "company",
    entityId: r.id,
    text: `Company: ${r.name} ${r.industry ? `in ${r.industry}` : ""} ${r.website || ""}`.trim(),
  }));
}

async function getContactContents(limit = 500): Promise<EntityContent[]> {
  const rows = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      title: contacts.title,
      email: contacts.email,
      companyName: companies.name,
    })
    .from(contacts)
    .leftJoin(companies, sql`${contacts.companyId} = ${companies.id}`)
    .limit(limit);

  return rows.map((r) => ({
    entityType: "contact",
    entityId: r.id,
    text: `Contact: ${r.firstName} ${r.lastName} ${r.title ? `(${r.title})` : ""} at ${r.companyName || "unknown"} ${r.email || ""}`.trim(),
  }));
}

async function getVendorContents(limit = 500): Promise<EntityContent[]> {
  const rows = await db.select().from(suppliers).limit(limit);
  return rows.map((r) => ({
    entityType: "vendor",
    entityId: r.id,
    text: `Vendor/Supplier: ${r.name} ${r.contactPerson ? `contact ${r.contactPerson}` : ""} ${r.email || ""}`.trim(),
  }));
}

// ──────── Sync Embeddings ────────

/**
 * Delta sync: generates/updates embeddings for entities whose content has changed.
 * Uses content_hash to skip unchanged entities.
 */
export async function syncEmbeddings(): Promise<{ synced: number; skipped: number; errors: number }> {
  if (!(await isSemanticSearchAvailable())) {
    return { synced: 0, skipped: 0, errors: 0 };
  }

  console.log("[search.embeddings] Starting delta sync...");

  const allContents = [
    ...(await getOrderContents()),
    ...(await getProductContents()),
    ...(await getCompanyContents()),
    ...(await getContactContents()),
    ...(await getVendorContents()),
  ];

  // Get existing hashes
  const existing = await db.execute(
    sql`SELECT entity_type, entity_id, content_hash FROM search_embeddings`,
  );
  const hashMap = new Map<string, string>();
  for (const row of existing.rows as any[]) {
    hashMap.set(`${row.entity_type}:${row.entity_id}`, row.content_hash);
  }

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches
  const BATCH_SIZE = 20;
  for (let i = 0; i < allContents.length; i += BATCH_SIZE) {
    const batch = allContents.slice(i, i + BATCH_SIZE);
    const toEmbed: EntityContent[] = [];

    for (const item of batch) {
      const hash = contentHash(item.text);
      const existingHash = hashMap.get(`${item.entityType}:${item.entityId}`);
      if (existingHash === hash) {
        skipped++;
        continue;
      }
      toEmbed.push(item);
    }

    if (toEmbed.length === 0) continue;

    // Generate embeddings for batch
    for (const item of toEmbed) {
      try {
        const embedding = await generateEmbedding(item.text);
        if (!embedding) {
          errors++;
          continue;
        }

        const hash = contentHash(item.text);
        const vectorStr = `[${embedding.join(",")}]`;

        await db.execute(sql`
          INSERT INTO search_embeddings (entity_type, entity_id, content_hash, embedding)
          VALUES (${item.entityType}, ${item.entityId}, ${hash}, ${vectorStr}::vector)
          ON CONFLICT (entity_type, entity_id)
          DO UPDATE SET content_hash = ${hash}, embedding = ${vectorStr}::vector, created_at = NOW()
        `);

        synced++;
      } catch (err: any) {
        console.error(`[search.embeddings] Error syncing ${item.entityType}:${item.entityId}: ${err.message}`);
        errors++;
      }
    }
  }

  console.log(`[search.embeddings] Sync complete: synced=${synced}, skipped=${skipped}, errors=${errors}`);
  return { synced, skipped, errors };
}

// ──────── Semantic Search ────────

export interface SemanticSearchResult {
  entityType: string;
  entityId: string;
  similarity: number;
}

export async function semanticSearch(
  query: string,
  entityTypes?: string[],
  limit = 20,
): Promise<SemanticSearchResult[]> {
  if (!(await isSemanticSearchAvailable())) {
    return [];
  }

  const embedding = await generateEmbedding(query);
  if (!embedding) return [];

  const vectorStr = `[${embedding.join(",")}]`;

  const entityFilter = entityTypes?.length
    ? sql`AND entity_type = ANY(${entityTypes})`
    : sql``;

  const results = await db.execute(sql`
    SELECT
      entity_type,
      entity_id,
      1 - (embedding <=> ${vectorStr}::vector) AS similarity
    FROM search_embeddings
    WHERE 1 - (embedding <=> ${vectorStr}::vector) > 0.3
    ${entityFilter}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `);

  return (results.rows as any[]).map((r) => ({
    entityType: r.entity_type,
    entityId: r.entity_id,
    similarity: Number(r.similarity),
  }));
}
