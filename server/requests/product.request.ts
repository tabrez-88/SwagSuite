import { z } from "zod";
import { insertProductSchema } from "@shared/schema";

// POST /api/products
export const createProductRequest = insertProductSchema;
export type CreateProductRequest = z.infer<typeof createProductRequest>;

// PATCH /api/products/:id
export const updateProductRequest = insertProductSchema.partial();
export type UpdateProductRequest = z.infer<typeof updateProductRequest>;

// POST /api/products/sync-from-supplier
export const syncProductRequest = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  supplierName: z.string().min(1, "Supplier name is required"),
  description: z.string().optional(),
  basePrice: z.number().optional(),
  category: z.string().optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  source: z.string().optional(),
});
export type SyncProductRequest = z.infer<typeof syncProductRequest>;

// GET /api/products/search?q=...
export const searchProductRequest = z.object({
  q: z.string().min(1, "Search query is required"),
});
export type SearchProductRequest = z.infer<typeof searchProductRequest>;
