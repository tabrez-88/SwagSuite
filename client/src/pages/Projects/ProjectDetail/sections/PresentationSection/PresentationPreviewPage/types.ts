import type { useProjectData } from "../../../hooks";

export interface PresentationPreviewPageProps {
  projectId: string;
  data: ReturnType<typeof useProjectData>;
}

export interface EnrichedItem {
  id: string;
  productName?: string;
  productSku?: string;
  unitPrice?: number;
  quantity?: number;
  imageUrl: string | null;
  colors: string[];
  sizes: string[];
  brand: string | null;
  description: string | null;
  lines: any[];
  charges: any[];
  [key: string]: any;
}

export interface ProductDetailLightboxProps {
  item: EnrichedItem;
  items: EnrichedItem[];
  companyName: string;
  primaryColor: string;
  logoUrl: string | null;
  hidePricing: boolean;
  onClose: () => void;
  onNavigate: (item: EnrichedItem) => void;
}
