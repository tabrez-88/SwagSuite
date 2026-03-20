export interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    supplierSku?: string;
    supplierId?: string;
    categoryId?: string;
    basePrice?: number;
    minimumQuantity?: number;
    colors?: string[];
    sizes?: string[];
    imprintMethods?: string[];
    leadTime?: number;
    imageUrl?: string;
    productType?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  supplierName?: string;
  onEdit?: (product: any) => void;
  onDelete?: (product: any) => void;
}
