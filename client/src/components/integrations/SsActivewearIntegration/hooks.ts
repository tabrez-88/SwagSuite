import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { SsActivewearProduct } from '@shared/schema';

export function useSsActivewearIntegration() {
  const [accountNumber, setAccountNumber] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SsActivewearProduct | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: brands, isLoading: loadingBrands, error: brandsError } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/ss-activewear/brands'],
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('GET', `/api/ss-activewear/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      console.log('S&S Search Response:', data);
      console.log('Is Array?', Array.isArray(data));
      return data as SsActivewearProduct[];
    },
    onError: (error) => {
      console.error('Search error:', error);
    },
  });

  const syncProductMutation = useMutation({
    mutationFn: async ({ products, productId }: { products: SsActivewearProduct[], productId?: string }) => {
      if (productId) {
        setSyncingProducts(prev => new Set(prev).add(productId));
      }
      const response = await apiRequest('POST', '/api/ss-activewear/products/sync', { products });
      const data = await response.json();
      return { data, productId };
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
        title: "Products Added",
        description: `${result.data.count || 1} product(s) successfully added to catalog`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error, variables: any) => {
      if (variables.productId) {
        setSyncingProducts(prev => {
          const next = new Set(prev);
          next.delete(variables.productId);
          return next;
        });
      }
      toast({
        title: "Sync Failed",
        description: "Failed to add products to catalog",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async ({ accountNumber, apiKey }: { accountNumber: string; apiKey: string }) => {
      const response = await apiRequest('POST', '/api/ss-activewear/test-connection', { accountNumber, apiKey });
      return response;
    },
    onSuccess: (data: any) => {
      if (data.connected) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to S&S Activewear API",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to S&S Activewear API. Please check your credentials.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Connection Error",
        description: "Failed to test connection to S&S Activewear API",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ss-activewear/import', { accountNumber, apiKey, styleFilter: styleFilter || undefined });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Import Started",
        description: "Product import has been started. You can monitor the progress below.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ss-activewear/import-jobs'] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: "Failed to start product import",
        variant: "destructive",
      });
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast({
        title: "Invalid Search",
        description: "Please enter at least 2 characters to search",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate(searchQuery);
  };

  const handleViewDetail = (product: SsActivewearProduct) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  const handleAddToCatalog = (product: SsActivewearProduct) => {
    syncProductMutation.mutate({ products: [product], productId: product.sku });
  };

  const handleTestConnection = () => {
    if (!accountNumber.trim() || !apiKey.trim()) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both account number and API key",
        variant: "destructive",
      });
      return;
    }
    testConnectionMutation.mutate({ accountNumber, apiKey });
  };

  const handleImport = () => {
    if (!accountNumber.trim() || !apiKey.trim()) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both account number and API key",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate();
  };

  return {
    accountNumber,
    setAccountNumber,
    apiKey,
    setApiKey,
    styleFilter,
    setStyleFilter,
    searchQuery,
    setSearchQuery,
    selectedProduct,
    detailModalOpen,
    setDetailModalOpen,
    syncingProducts,
    brands,
    loadingBrands,
    brandsError,
    searchMutation,
    syncProductMutation,
    testConnectionMutation,
    importMutation,
    handleSearch,
    handleViewDetail,
    handleAddToCatalog,
    handleTestConnection,
    handleImport,
  };
}
