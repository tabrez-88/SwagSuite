import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSanmarSearch, useSanmarSync } from "@/services/integrations/sanmar";
import type { SanMarProduct } from "./types";

export function useSanmarIntegration() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<SanMarProduct | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const searchMutation = useSanmarSearch();
  const syncProductMutation = useSanmarSync();

  const handleSearch = () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast({
        title: "Invalid Search",
        description: "Please enter at least 2 characters to search (Style ID or name)",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate(searchQuery, {
      onError: (error: Error) => {
        toast({
          title: "Search Failed",
          description: error.message || "Failed to search SanMar products. Please check your API credentials.",
          variant: "destructive",
        });
      },
    });
  };

  const handleViewDetail = (product: SanMarProduct) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  const handleAddToCatalog = (product: SanMarProduct) => {
    const productId = product.styleId;
    setSyncingProducts((prev) => new Set(prev).add(productId));
    syncProductMutation.mutate(
      { products: [product], productId },
      {
        onSettled: () => {
          setSyncingProducts((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        },
        onSuccess: (result) => {
          toast({
            title: "Products Added",
            description: `${result.count} product(s) successfully added to catalog`,
          });
        },
        onError: () => {
          toast({
            title: "Sync Failed",
            description: "Failed to add products to catalog",
            variant: "destructive",
          });
        },
      },
    );
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedProduct,
    detailModalOpen,
    setDetailModalOpen,
    syncingProducts,
    searchMutation,
    syncProductMutation,
    handleSearch,
    handleViewDetail,
    handleAddToCatalog,
  };
}
