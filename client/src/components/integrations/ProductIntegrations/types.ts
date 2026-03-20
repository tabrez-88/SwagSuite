export interface ProductSearchResult {
  id: string;
  sourceSystem: 'esp' | 'sage' | 'dc';
  productName: string;
  supplierName: string;
  category: string;
  description: string;
  minPrice: number;
  maxPrice: number;
  minQuantity: number;
  decorationMethods: string[];
  colors: string[];
  primaryImage?: string;
  qualityScore: number;
  popularityScore: number;
  asiNumber?: string;
  eqpLevel?: string;
}

export interface IntegrationConfig {
  id: string;
  integration: string;
  displayName: string;
  syncEnabled: boolean;
  isHealthy: boolean;
  totalSyncs: number;
  totalRecordsSynced: number;
  status: string;
}

export interface ProductSearchResponse {
  results: ProductSearchResult[];
  totalFound: number;
  searchTime: string;
}
