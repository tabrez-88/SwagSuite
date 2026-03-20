export interface SageProduct {
  productId: string;
  productNumber: string;
  productName: string;
  supplierName: string;
  supplierId: string;
  category: string;
  subcategory?: string;
  description: string;
  colors?: string[];
  eqpLevel?: string;
  pricingStructure?: any;
  quantityBreaks?: any[];
  decorationMethods?: string[];
  imageGallery?: string[];
  asiNumber?: string;
  dimensions?: string;
  weight?: string;
  features?: string[];
  materials?: string[];
  complianceCertifications?: string[];
}
