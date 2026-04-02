import { z } from "zod";
import { insertLeadSchema } from "@shared/schema";

// Coerce types that arrive as different JSON types from the frontend
const coercedLeadSchema = insertLeadSchema.extend({
  estimatedValue: z.union([z.string(), z.number()]).transform(v => String(v)).optional().nullable(),
  nextFollowUpDate: z.union([z.date(), z.string().transform(v => new Date(v))]).optional().nullable(),
  lastContactDate: z.union([z.date(), z.string().transform(v => new Date(v))]).optional().nullable(),
});

// POST /api/leads
export const createLeadRequest = coercedLeadSchema;
export type CreateLeadRequest = z.infer<typeof createLeadRequest>;

// PATCH /api/leads/:id
export const updateLeadRequest = coercedLeadSchema.partial();
export type UpdateLeadRequest = z.infer<typeof updateLeadRequest>;
