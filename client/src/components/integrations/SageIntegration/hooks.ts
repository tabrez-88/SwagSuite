import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { SageProduct } from './types';

export function useSageIntegration() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SageProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SageProduct | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: syncedProducts, isLoading: loadingProducts } = useQuery<any[]>({
    queryKey: ['/api/sage/products'],
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/integrations/sage/test');
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Connection Successful",
        description: data.message || "Successfully connected to SAGE API",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Unable to connect to SAGE API. Please check your credentials in Settings.",
        variant: "destructive",
      });
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      setIsSearching(true);
      const response = await fetch(`/api/sage/products?search=${encodeURIComponent(query)}&limit=50`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || "Failed to search SAGE products");
      }
      console.log('SAGE search response:', response);
      return await response.json();
    },
    onSuccess: (products: SageProduct[]) => {
      setSearchResults(products);
      toast({
        title: "Search Complete",
        description: `Found ${products.length} products from SAGE API`,
      });
    },
    onError: (error: any) => {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search SAGE products",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSearching(false);
    },
  });

  const syncProductMutation = useMutation({
    mutationFn: async ({ products, productId }: { products: SageProduct[], productId?: string }) => {
      if (productId) {
        setSyncingProducts(prev => new Set(prev).add(productId));
      }
      const response = await apiRequest('POST', '/api/integrations/sage/products/sync', { products });
      return { data: await response.json(), productId };
    },
    onSuccess: (result: any) => {
      if (result.productId) {
        setSyncingProducts(prev => {
          const next = new Set(prev);
          next.delete(result.productId);
          return next;
        });
      }
      toast({
        title: "Product Added",
        description: result.data.message || "Product has been added to your catalog",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sage/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
    },
    onError: (error: any, variables: any) => {
      if (variables.productId) {
        setSyncingProducts(prev => {
          const next = new Set(prev);
          next.delete(variables.productId);
          return next;
        });
      }
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to add product to catalog",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Empty Search",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate(searchQuery);
  };

  const handleAddProduct = (product: SageProduct) => {
    syncProductMutation.mutate({ products: [product], productId: product.productId });
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
  };
}
