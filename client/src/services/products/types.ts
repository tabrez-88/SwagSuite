export interface SsActivewearProduct {
  sku: string;
  gtin: string;
  styleID: number;
  brandName: string;
  styleName: string;
  colorName: string;
  colorCode: string;
  sizeName: string;
  sizeCode: string;
  unitWeight: number;
  caseQty: number;
  piecePrice: number;
  dozenPrice: number;
  casePrice: number;
  customerPrice: number;
  qty: number;
  colorFrontImage: string;
  colorBackImage: string;
  colorSideImage: string;
  colorSwatchImage: string;
  countryOfOrigin: string;
}

export interface SageProduct {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price?: number;
  imageUrl?: string;
  brand?: string;
  category?: string;
  supplierName?: string;
  supplierId?: string;
  asiNumber?: string;
  colors?: string[];
  sizes?: string[];
}

export interface SanMarProductResult {
  styleId: string;
  styleName: string;
  brandName: string;
  productTitle: string;
  productDescription: string;
  categoryName: string;
  availableSizes: string;
  caseSize: number;
  pieceWeight?: number;
  casePrice?: number;
  caseSalePrice?: number;
  dozenPrice?: number;
  dozenSalePrice?: number;
  piecePrice?: number;
  pieceSalePrice?: number;
  priceCode?: string;
  priceText?: string;
  colors: string[];
  sizes: string[];
  productImage?: string;
  colorProductImage?: string;
  frontModel?: string;
  backModel?: string;
  frontFlat?: string;
  backFlat?: string;
  thumbnailImage?: string;
  brandLogoImage?: string;
  productStatus?: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  supplierId?: number | string;
  basePrice?: string;
  minimumQuantity?: number;
  colors?: string[];
  sizes?: string[];
  imprintMethods?: string[];
  leadTime?: string;
  imageUrl?: string;
  brand?: string;
  category?: string;
}
