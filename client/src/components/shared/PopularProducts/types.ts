export interface PopularProduct {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  productType: 'apparel' | 'hard_goods';
  totalQuantity: number;
  orderCount: number;
  avgPrice: number;
  totalRevenue: number;
}

export interface SuggestedProduct {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  productType: 'apparel' | 'hard_goods';
  presentationCount: number;
  avgPresentationPrice: number;
  discount: number;
  adminNote: string;
  isAdminSuggested: boolean;
}

export interface VendorIntegration {
  vendor: string;
  sku: string;
  price: number;
  inventory: number;
  leadTime: string;
  available: boolean;
}

export interface ProductDetails {
  id: string;
  name: string;
  description: string;
  category: string;
  colors: string[];
  sizes: string[];
  materials: string[];
  features: string[];
  vendorIntegrations: VendorIntegration[];
  totalSales: number;
  avgRating: number;
  reviewCount: number;
}
