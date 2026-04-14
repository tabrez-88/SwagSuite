import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@/lib/wouter-compat";
import type { ProductDetailModalProps } from "./types";

// Helper function to parse array fields that might be stored as strings or JSON
export const parseArrayField = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field.filter(item => item && typeof item === 'string');
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && typeof item === 'string');
      }
      // If parsed is an object or other type, return empty
      return [];
    } catch {
      // If not valid JSON, treat as single value
      return field.trim() ? [field.trim()] : [];
    }
  }
  return [];
};

export function useProductDetailModal({ product, open, onOpenChange }: Pick<ProductDetailModalProps, 'product' | 'open' | 'onOpenChange'>) {
  const [, setLocation] = useLocation();

  // Fetch orders that include this product
  const { data: ordersWithProduct = [] } = useQuery<any[]>({
    queryKey: ["/api/products", product?.id, "orders"],
    enabled: !!product?.id && open,
    queryFn: async () => {
      // In a real implementation, this would fetch orders containing this product
      // For now, we'll return empty array
      return [];
    },
  });

  const handleCreateQuote = () => {
    setLocation(`/projects?product=${product!.id}`);
    onOpenChange(false);
  };

  const handleEdit = (onEdit?: (product: any) => void) => {
    if (onEdit && product) {
      onEdit(product);
      onOpenChange(false);
    }
  };

  const handleDelete = (onDelete?: (product: any) => void) => {
    if (onDelete && product) {
      onDelete(product);
      onOpenChange(false);
    }
  };

  const handleNavigateToOrder = (projectId: string) => {
    setLocation(`/projects?id=${projectId}`);
    onOpenChange(false);
  };

  return {
    ordersWithProduct,
    handleCreateQuote,
    handleEdit,
    handleDelete,
    handleNavigateToOrder,
  };
}
