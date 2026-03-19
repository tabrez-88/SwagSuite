import { z } from "zod";
import { insertLeadSchema } from "@shared/schema";

// POST /api/leads
export const createLeadRequest = insertLeadSchema;
export type CreateLeadRequest = z.infer<typeof createLeadRequest>;

// PATCH /api/leads/:id
export const updateLeadRequest = insertLeadSchema.partial();
export type UpdateLeadRequest = z.infer<typeof updateLeadRequest>;
