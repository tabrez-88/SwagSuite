import type { SsActivewearProduct, SageProduct, SanMarProductResult } from "@/services/products";

export interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

export interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  price: string;
  supplierId: string;
  category: string;
  brand: string;
  style: string;
  color: string;
  size: string;
}

export interface NewSupplierData {
  name: string;
  email: string;
  phone: string;
  website: string;
}

export type DataSource = "manual" | "ss-activewear" | "sage" | "sanmar";

export type { SsActivewearProduct, SageProduct, SanMarProductResult };
