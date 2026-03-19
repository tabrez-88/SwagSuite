import { z } from "zod";
import { insertSupplierSchema } from "@shared/schema";

// POST /api/suppliers
export const createSupplierRequest = insertSupplierSchema;
export type CreateSupplierRequest = z.infer<typeof createSupplierRequest>;

// PATCH /api/suppliers/:id
export const updateSupplierRequest = insertSupplierSchema.partial();
export type UpdateSupplierRequest = z.infer<typeof updateSupplierRequest>;
