import { useState, useMemo } from "react";
import { useRoute, useLocation } from "@/lib/wouter-compat";
import { useToast } from "@/hooks/use-toast";
import { useMarginSettings } from "@/hooks/useMarginSettings";
import {
  useProduct,
  useProductOrders,
  useDeleteProduct,
  updateProduct,
} from "@/services/products";
import { useSuppliers } from "@/services/suppliers";

// Helper to parse array fields that might be stored as strings or JSON
export const parseArrayField = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field.filter(item => item && typeof item === 'string');
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed.filter(item => item && typeof item === 'string');
      return [];
    } catch {
      return field.trim() ? [field.trim()] : [];
    }
  }
  return [];
};

export function useProductDetail() {
  const [, params] = useRoute("/products/:id");
  const productId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const marginSettings = useMarginSettings();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: product, isLoading } = useProduct(productId ?? "");
  const { data: suppliers = [] } = useSuppliers() as unknown as { data: any[] };
  const { data: ordersWithProduct = [] } = useProductOrders<any[]>(productId);

  const supplierName = useMemo(() => {
    if (!product?.supplierId || !suppliers.length) return null;
    return suppliers.find((s: any) => s.id === product.supplierId)?.name || null;
  }, [product?.supplierId, suppliers]);

  const pricingTiers = useMemo(() => {
    return (product?.pricingTiers || []) as { quantity: number; cost: number }[];
  }, [product?.pricingTiers]);

  const handleBack = () => setLocation("/products");

  const handleNavigateToOrder = (orderId: string) => {
    setLocation(`/projects/${orderId}/overview`);
  };

  const _delete = useDeleteProduct();
  const handleDelete = async () => {
    if (!productId) return;
    if (!confirm("Delete this product?")) return;
    _delete.mutate(productId, {
      onSuccess: () => {
        toast({ title: "Product deleted" });
        setLocation("/products");
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const handleSaveTiers = (tiers: { quantity: number; cost: number }[]) => {
    if (!productId) return;
    updateProduct(productId, { pricingTiers: tiers }).catch(() => {
      /* best-effort */
    });
  };

  return {
    product,
    supplierName,
    ordersWithProduct,
    isLoading,
    isEditOpen,
    setIsEditOpen,
    pricingTiers,
    marginSettings,
    handleBack,
    handleNavigateToOrder,
    handleDelete,
    handleSaveTiers,
    parseArrayField,
  };
}
