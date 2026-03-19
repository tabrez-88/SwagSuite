import { z } from "zod";
import { insertCompanySchema } from "@shared/schema";

// POST /api/companies
export const createCompanyRequest = insertCompanySchema;
export type CreateCompanyRequest = z.infer<typeof createCompanyRequest>;

// PATCH /api/companies/:id
export const updateCompanyRequest = insertCompanySchema.partial();
export type UpdateCompanyRequest = z.infer<typeof updateCompanyRequest>;

// GET /api/companies/search?q=...
export const searchCompanyRequest = z.object({
  q: z.string().min(1, "Search query is required"),
});
export type SearchCompanyRequest = z.infer<typeof searchCompanyRequest>;
