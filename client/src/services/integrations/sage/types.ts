export type { SageProduct } from "@/components/integrations/SageIntegration/types";

// Stored / synced SAGE product row returned from `/api/sage/products`.
// The backend shape includes DB columns like `id`, `brand` that don't exist
// on the SAGE API DTO — keep as `unknown` record until we have a concrete type.
export type SyncedSageProduct = Record<string, any>;
