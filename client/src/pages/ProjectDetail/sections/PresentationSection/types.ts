import type { useProjectData } from "../../hooks";

export interface PresentationSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}

export type ViewMode = "detailed" | "grid";

export interface PresentationStatus {
  value: string;
  label: string;
  color: string;
}

export interface EnrichedItem {
  id: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  supplierName?: string;
  imageUrl: string | null;
  colors: string[];
  sizes: string[];
  brand: string | null;
  description: string | null;
  lines: any[];
  charges: any[];
  isVisible: boolean;
  quantity?: number;
  unitPrice?: string | number;
  cost?: string | number;
  priceLabel?: string;
  personalComment?: string;
  privateNotes?: string;
  imprintLocation?: string;
  imprintMethod?: string;
  decoratorType?: string;
  productImageUrl?: string;
  productColors?: string[];
  productSizes?: string[];
  productBrand?: string;
  productDescription?: string;
  productName_original?: string;
  [key: string]: any;
}
