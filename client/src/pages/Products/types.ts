export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  supplierId?: string;
  basePrice?: number;
  minimumQuantity?: number;
  colors?: string[];
  sizes?: string[];
  imprintMethods?: string[];
  leadTime?: number;
  imageUrl?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
}
