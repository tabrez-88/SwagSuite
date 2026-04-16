import type { ProjectData } from "@/types/project-types";

export interface AddProductPageProps {
  projectId: string;
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
  pricingTiers?: { quantity: number; cost: number }[];
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

// ── Local charge / artwork types (pre-creation, stored in memory) ──

export interface LocalCharge {
  tempId: string;
  description: string;
  chargeType: string;
  chargeCategory: "run" | "fixed";
  amount: number;
  netCost: number;
  retailPrice: number;
  margin: number;
  quantity: number;
  isVendorCharge: boolean;
  displayToClient: boolean;
  displayToVendor: boolean;
  includeInUnitPrice: boolean;
}

export interface LocalArtworkCharge {
  tempId: string;
  chargeName: string;
  chargeCategory: "run" | "fixed";
  netCost: number;
  margin: number;
  retailPrice: number;
  quantity: number;
  displayMode: "include_in_price" | "display_to_client" | "subtract_from_margin";
}

export interface LocalArtwork {
  tempId: string;
  name: string;
  filePath: string;
  fileName: string;
  thumbnailUrl?: string;
  location: string;
  artworkType: string;
  color: string;
  size: string;
  numberOfColors: number;
  repeatLogo: boolean;
  charges: LocalArtworkCharge[];
}
