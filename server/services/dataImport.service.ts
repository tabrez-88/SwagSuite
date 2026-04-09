import { db } from "../db";
import { companies, contacts, type InsertCompany, type InsertContact } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export type ImportEntity = "companies" | "contacts";

export interface ImportRowResult {
  row: number;
  status: "success" | "failed" | "skipped";
  id?: string;
  error?: string;
  data?: Record<string, string>;
}

export interface ImportSummary {
  entity: ImportEntity;
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: ImportRowResult[];
}

/**
 * Minimal RFC-4180-ish CSV parser.
 * Supports quoted fields, embedded commas, embedded newlines inside quotes,
 * and escaped quotes ("").
 */
export function parseCsv(text: string): string[][] {
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      cur.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      // Normalize CRLF → LF
      i++;
      continue;
    }
    if (ch === "\n") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  // Flush final field/row
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }

  // Drop fully-empty trailing rows
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/**
 * Parse CSV into array of objects keyed by header row,
 * applying an optional column mapping (csvHeader → canonicalField).
 */
export function csvToRecords(
  csvText: string,
  mapping?: Record<string, string>,
): Record<string, string>[] {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  const canonicalHeaders = mapping
    ? headers.map((h) => mapping[h] || mapping[h.toLowerCase()] || h)
    : headers;

  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    canonicalHeaders.forEach((key, idx) => {
      if (key) obj[key] = (row[idx] ?? "").trim();
    });
    return obj;
  });
}

/**
 * Canonical field names accepted by each importer.
 * Used by the UI to suggest column mappings and by validation.
 */
export const COMPANY_FIELDS = [
  "name",
  "email",
  "phone",
  "website",
  "industry",
  "notes",
  "accountNumber",
  "defaultTerms",
  "goodsyncFolderUrl",
] as const;

export const CONTACT_FIELDS = [
  "companyName", // resolved → companyId
  "firstName",
  "lastName",
  "email",
  "phone",
  "title",
  "department",
  "leadSource",
  "isPrimary",
  "mailingAddress",
] as const;

const truthy = (v: string) =>
  ["true", "yes", "y", "1", "x"].includes(v.trim().toLowerCase());

export class DataImportService {
  /**
   * Import companies from CSV. Skips rows missing required `name`.
   * De-dupes on exact name match (case-insensitive) — existing row is skipped.
   */
  async importCompanies(
    csvText: string,
    mapping?: Record<string, string>,
  ): Promise<ImportSummary> {
    const records = csvToRecords(csvText, mapping);
    const results: ImportRowResult[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // +1 for header, +1 for 1-indexed

      const name = row.name?.trim();
      if (!name) {
        results.push({
          row: rowNum,
          status: "failed",
          error: "Missing required field: name",
          data: row,
        });
        continue;
      }

      try {
        // De-dupe: exact name match (case-insensitive)
        const [existing] = await db
          .select({ id: companies.id })
          .from(companies)
          .where(sql`LOWER(${companies.name}) = LOWER(${name})`)
          .limit(1);

        if (existing) {
          results.push({
            row: rowNum,
            status: "skipped",
            id: existing.id,
            error: "Company with same name already exists",
          });
          continue;
        }

        const insertData: InsertCompany = {
          name,
          email: row.email || undefined,
          phone: row.phone || undefined,
          website: row.website || undefined,
          industry: row.industry || undefined,
          notes: row.notes || undefined,
          accountNumber: row.accountNumber || undefined,
          defaultTerms: row.defaultTerms || undefined,
          goodsyncFolderUrl: row.goodsyncFolderUrl || undefined,
        };

        const [inserted] = await db
          .insert(companies)
          .values(insertData)
          .returning({ id: companies.id });

        results.push({ row: rowNum, status: "success", id: inserted.id });
      } catch (err: any) {
        results.push({
          row: rowNum,
          status: "failed",
          error: err?.message || "Insert failed",
          data: row,
        });
      }
    }

    return this.summarize("companies", results);
  }

  /**
   * Import contacts from CSV. Requires `firstName`, `lastName`.
   * If `companyName` is present, resolves to existing company (case-insensitive
   * match) or skips the row if not found — importer refuses to guess.
   */
  async importContacts(
    csvText: string,
    mapping?: Record<string, string>,
  ): Promise<ImportSummary> {
    const records = csvToRecords(csvText, mapping);
    const results: ImportRowResult[] = [];

    // Preload company lookup to avoid N+1
    const allCompanies = await db
      .select({ id: companies.id, name: companies.name })
      .from(companies);
    const companyByName = new Map<string, string>();
    for (const c of allCompanies) {
      if (c.name) companyByName.set(c.name.toLowerCase(), c.id);
    }

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      const firstName = row.firstName?.trim();
      const lastName = row.lastName?.trim();

      if (!firstName || !lastName) {
        results.push({
          row: rowNum,
          status: "failed",
          error: "Missing required field: firstName or lastName",
          data: row,
        });
        continue;
      }

      let companyId: string | undefined;
      if (row.companyName?.trim()) {
        companyId = companyByName.get(row.companyName.trim().toLowerCase());
        if (!companyId) {
          results.push({
            row: rowNum,
            status: "failed",
            error: `Company not found: "${row.companyName}"`,
            data: row,
          });
          continue;
        }
      }

      try {
        const insertData: InsertContact = {
          firstName,
          lastName,
          companyId,
          email: row.email || undefined,
          phone: row.phone || undefined,
          title: row.title || undefined,
          department: row.department || undefined,
          leadSource: row.leadSource || undefined,
          mailingAddress: row.mailingAddress || undefined,
          isPrimary: row.isPrimary ? truthy(row.isPrimary) : undefined,
        };

        const [inserted] = await db
          .insert(contacts)
          .values(insertData)
          .returning({ id: contacts.id });

        results.push({ row: rowNum, status: "success", id: inserted.id });
      } catch (err: any) {
        results.push({
          row: rowNum,
          status: "failed",
          error: err?.message || "Insert failed",
          data: row,
        });
      }
    }

    return this.summarize("contacts", results);
  }

  /**
   * Preview the first N rows of a CSV after mapping, so the UI can show
   * what will actually be imported before the user commits.
   */
  preview(
    csvText: string,
    mapping?: Record<string, string>,
    limit = 10,
  ): { headers: string[]; rows: Record<string, string>[]; totalRows: number } {
    const all = parseCsv(csvText);
    const headers = (all[0] || []).map((h) => h.trim());
    const records = csvToRecords(csvText, mapping);
    return {
      headers,
      rows: records.slice(0, limit),
      totalRows: records.length,
    };
  }

  private summarize(entity: ImportEntity, results: ImportRowResult[]): ImportSummary {
    const succeeded = results.filter((r) => r.status === "success").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    return {
      entity,
      total: results.length,
      succeeded,
      failed,
      skipped,
      results,
    };
  }
}

export const dataImportService = new DataImportService();
