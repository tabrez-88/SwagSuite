import type { Request, Response } from "express";
import { dataImportService, COMPANY_FIELDS, CONTACT_FIELDS } from "../services/dataImport.service";

/**
 * File upload field name used by all import endpoints.
 * The client must send the CSV as multipart/form-data with this field.
 */
export const IMPORT_FILE_FIELD = "file";

function parseMapping(raw: unknown): Record<string, string> | undefined {
  if (!raw) return undefined;
  if (typeof raw === "object") return raw as Record<string, string>;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function getCsvText(req: Request): string | null {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (file?.buffer) return file.buffer.toString("utf8");
  if (typeof req.body?.csv === "string") return req.body.csv;
  return null;
}

export class DataImportController {
  /** GET /api/import/fields — returns canonical field names for UI mapping */
  static async getFields(_req: Request, res: Response) {
    res.json({
      companies: COMPANY_FIELDS,
      contacts: CONTACT_FIELDS,
    });
  }

  /** POST /api/import/preview — parse CSV and return first 10 mapped rows */
  static async preview(req: Request, res: Response) {
    const csv = getCsvText(req);
    if (!csv) {
      return res.status(400).json({ message: "No CSV file provided" });
    }
    const mapping = parseMapping(req.body?.mapping);
    const result = dataImportService.preview(csv, mapping);
    res.json(result);
  }

  /** POST /api/import/companies — import companies from CSV */
  static async importCompanies(req: Request, res: Response) {
    const csv = getCsvText(req);
    if (!csv) {
      return res.status(400).json({ message: "No CSV file provided" });
    }
    const mapping = parseMapping(req.body?.mapping);
    const summary = await dataImportService.importCompanies(csv, mapping);
    res.json(summary);
  }

  /** POST /api/import/contacts — import contacts from CSV */
  static async importContacts(req: Request, res: Response) {
    const csv = getCsvText(req);
    if (!csv) {
      return res.status(400).json({ message: "No CSV file provided" });
    }
    const mapping = parseMapping(req.body?.mapping);
    const summary = await dataImportService.importContacts(csv, mapping);
    res.json(summary);
  }
}
