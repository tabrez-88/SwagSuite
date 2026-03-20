import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductSearchResult, IntegrationConfig, ProductSearchResponse } from "./types";

export function useProductIntegrations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configs, isLoading: configsLoading } = useQuery<IntegrationConfig[]>({
    queryKey: ['/api/integrations/configurations'],
  });

  const { data: searchResults, isLoading: searchLoading, refetch: searchProducts } = useQuery<ProductSearchResponse>({
    queryKey: ['/api/integrations/products/search', { query: searchQuery, source: selectedSource, category: selectedCategory }],
    enabled: false,
  });

  const syncMutation = useMutation({
    mutationFn: async ({ source, syncType }: { source: string; syncType: string }) => {
      return await apiRequest(`/api/integrations/${source}/sync`, 'POST', { syncType });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Sync Initiated",
        description: data.message || "Product sync has been initiated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/configurations'] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to initiate product sync. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchProducts();
    }
  };

  const handleSync = (source: string) => {
    syncMutation.mutate({ source, syncType: 'incremental' });
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
