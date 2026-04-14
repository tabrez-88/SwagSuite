import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useSageSyncedProducts,
  useSageTestConnection,
  useSageSearch,
  useSageSync,
} from "@/services/integrations/sage";
import type { SageProduct } from "./types";

export function useSageIntegration() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SageProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SageProduct | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: syncedProducts, isLoading: loadingProducts } = useSageSyncedProducts();
  const testConnectionMutation = useSageTestConnection();
  const searchMutation = useSageSearch();
  const syncProductMutation = useSageSync();

  const handleTestConnection = () => {
    testConnectionMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast({ title: "Connection Successful", description: data.message || "Successfully connected to SAGE API" });
      },
      onError: (error: Error) => {
        toast({
          title: "Connection Failed",
          description: error.message || "Unable to connect to SAGE API. Please check your credentials in Settings.",
          variant: "destructive",
        });
      },
    });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({ title: "Empty Search", description: "Please enter a search term", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    searchMutation.mutate(searchQuery, {
      onSuccess: (products) => {
        setSearchResults(products);
        toast({ title: "Search Complete", description: `Found ${products.length} products from SAGE API` });
      },
      onError: (error: Error) => {
        toast({
          title: "Search Failed",
          description: error.message || "Failed to search SAGE products",
          variant: "destructive",
        });
      },
      onSettled: () => setIsSearching(false),
    });
  };

  const handleAddProduct = (product: SageProduct) => {
    const productId = product.productId;
    setSyncingProducts((prev) => new Set(prev).add(productId));
    syncProductMutation.mutate(
      { products: [product], productId },
      {
        onSuccess: (data) => {
          toast({ title: "Product Added", description: data.message || "Product has been added to your catalog" });
        },
        onError: (error: Error) => {
          toast({
            title: "Sync Failed",
            description: error.message || "Failed to add product to catalog",
            variant: "destructive",
          });
        },
        onSettled: () => {
          setSyncingProducts((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        },
      },
    );
  };

  const handleViewDetails = (product: SageProduct) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    selectedProduct,
    isDetailModalOpen,
    setIsDetailModalOpen,
    syncingProducts,
    syncedProducts,
    loadingProducts,
    testConnectionMutation,
    syncProductMutation,
    handleSearch,
    handleAddProduct,
    handleViewDetails,
    handleTestConnection,
  };
}
