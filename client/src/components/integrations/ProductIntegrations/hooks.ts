import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useIntegrationConfigurations,
  useProductIntegrationSearch,
  useIntegrationSync,
} from "@/services/integrations/products";
import type { ProductSearchResult } from "./types";

export function useProductIntegrations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const { toast } = useToast();

  const { data: configs, isLoading: configsLoading } = useIntegrationConfigurations();
  const {
    data: searchResults,
    isLoading: searchLoading,
    refetch: searchProducts,
  } = useProductIntegrationSearch(searchQuery, selectedSource, selectedCategory, false);

  const syncMutation = useIntegrationSync();

  const handleSearch = () => {
    if (searchQuery.trim()) searchProducts();
  };

  const handleSync = (source: string) => {
    syncMutation.mutate(
      { source, syncType: "incremental" },
      {
        onSuccess: (data) =>
          toast({
            title: "Sync Initiated",
            description: data.message || "Product sync has been initiated successfully.",
          }),
        onError: () =>
          toast({
            title: "Sync Failed",
            description: "Failed to initiate product sync. Please try again.",
            variant: "destructive",
          }),
      },
    );
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedSource,
    setSelectedSource,
    selectedCategory,
    setSelectedCategory,
    selectedProduct,
    setSelectedProduct,
    configs,
    configsLoading,
    searchResults,
    searchLoading,
    syncMutation,
    handleSearch,
    handleSync,
  };
}
