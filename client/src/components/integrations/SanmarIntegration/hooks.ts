import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { SanMarProduct } from './types';

export function useSanmarIntegration() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<SanMarProduct | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set());
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const searchMutation = useMutation({
        mutationFn: async (query: string) => {
            const response = await apiRequest('GET', `/api/sanmar/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            console.log('SanMar Search Response:', data);
            return data as SanMarProduct[];
        },
        onError: (error: any) => {
            console.error('Search error:', error);
            toast({
                title: "Search Failed",
                description: error.message || "Failed to search SanMar products. Please check your API credentials.",
                variant: "destructive",
            });
        },
    });

    const syncProductMutation = useMutation({
        mutationFn: async ({ products, productId }: { products: SanMarProduct[], productId?: string }) => {
            if (productId) {
                setSyncingProducts(prev => new Set(prev).add(productId));
            }
            const response = await apiRequest('POST', '/api/sanmar/products/sync', { products });
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
            queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
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

    const handleSearch = async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            toast({
                title: "Invalid Search",
                description: "Please enter at least 2 characters to search (Style ID or name)",
                variant: "destructive",
            });
            return;
        }
        searchMutation.mutate(searchQuery);
    };

    const handleViewDetail = (product: SanMarProduct) => {
        setSelectedProduct(product);
        setDetailModalOpen(true);
    };

    const handleAddToCatalog = (product: SanMarProduct) => {
        syncProductMutation.mutate({ products: [product], productId: product.styleId });
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
