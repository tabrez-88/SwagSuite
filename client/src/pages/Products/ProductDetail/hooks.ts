import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useMarginSettings } from "@/hooks/useMarginSettings";
import { apiRequest } from "@/lib/queryClient";

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
  const queryClient = useQueryClient();
  const marginSettings = useMarginSettings();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch product
  const { data: product, isLoading } = useQuery<any>({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/products/${productId}`);
      return res.json();
    },
    enabled: !!productId,
  });

  // Fetch suppliers for name lookup
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    staleTime: Infinity,
  });

  const supplierName = useMemo(() => {
    if (!product?.supplierId || !suppliers.length) return null;
    return suppliers.find((s: any) => s.id === product.supplierId)?.name || null;
  }, [product?.supplierId, suppliers]);

  // Fetch orders that use this product
  const { data: ordersWithProduct = [] } = useQuery<any[]>({
    queryKey: ["/api/products", productId, "orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/products/${productId}/orders`);
      return res.json();
    },
    enabled: !!productId,
  });

  // Pricing tiers from product
  const pricingTiers = useMemo(() => {
    return (product?.pricingTiers || []) as { quantity: number; cost: number }[];
  }, [product?.pricingTiers]);

  const handleBack = () => setLocation("/products");

  const handleNavigateToOrder = (orderId: string) => {
    setLocation(`/projects/${orderId}/overview`);
  };

  const handleDelete = async () => {
    if (!productId) return;
    if (!confirm("Delete this product?")) return;
    try {
      await apiRequest("DELETE", `/api/products/${productId}`);
      toast({ title: "Product deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setLocation("/products");
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleSaveTiers = (tiers: { quantity: number; cost: number }[]) => {
    if (!productId) return;
    fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pricingTiers: tiers }),
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
    }).catch(() => { /* best-effort */ });
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
