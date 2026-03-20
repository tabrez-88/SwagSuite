import type { ProjectData } from "@/types/project-types";

export interface AddProductPageProps {
  orderId: string;
  data: ProjectData;
}

// Unified product result from any source
export interface ProductResult {
  id: string;
  source: "sage" | "sanmar" | "ss_activewear" | "local" | "unified";
  name: string;
  sku?: string;
  description?: string;
  supplierName?: string;
  supplierId?: string;
  category?: string;
  imageUrl?: string;
  basePrice?: number;
  baseCost?: number;
  colors?: string[];
  sizes?: string[];
  minQuantity?: number;
  decorationMethods?: string[];
  rawData?: any;
}

// Line item for configuration dialog
export interface ConfigLine {
  id: string;
  color: string;
  size: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
}

export type SourceTab = "sage" | "sanmar" | "ss_activewear" | "catalog" | "manual";
