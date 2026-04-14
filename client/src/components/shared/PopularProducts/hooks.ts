import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@/lib/wouter-compat';
import type { PopularProduct, SuggestedProduct, ProductDetails } from './types';

export function usePopularProducts() {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedProductType, setSelectedProductType] = useState<'all' | 'apparel' | 'hard_goods'>('all');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { data: products = [], isLoading } = useQuery<PopularProduct[]>({
    queryKey: ['/api/products/popular', { period: selectedPeriod, productType: selectedProductType }]
  });

  const { data: suggestedProducts = [], isLoading: suggestedLoading } = useQuery<SuggestedProduct[]>({
    queryKey: ['/api/products/suggested']
  });

  const handleAISearch = async () => {
    if (!aiSearchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/search/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: aiSearchQuery }),
      });

      if (!response.ok) {
        throw new Error('AI search failed');
      }

      const searchResults = await response.json();
      console.log('AI Search Results:', searchResults);

      // Display first result in product modal if available
      if (searchResults.results && searchResults.results.length > 0) {
        const firstResult = searchResults.results[0];
        const productDetails: ProductDetails = {
          id: firstResult.id,
          name: firstResult.name,
          description: firstResult.description,
          category: firstResult.category,
          colors: firstResult.colors,
          sizes: firstResult.sizes,
          materials: firstResult.materials,
          features: firstResult.features,
          vendorIntegrations: firstResult.vendorIntegrations,
          totalSales: firstResult.totalSales,
          avgRating: firstResult.avgRating,
          reviewCount: Math.floor(firstResult.totalSales * 0.15)
        };

        setSelectedProduct(productDetails);
        setIsProductModalOpen(true);
      } else {
        alert(`AI Search found no results for: "${aiSearchQuery}"`);
      }

      setIsSearching(false);
    } catch (error) {
      console.error('AI Search error:', error);
      setIsSearching(false);
      alert('AI search failed. Please try again.');
    }
  };

  const handleProductClick = (product: PopularProduct) => {
    // Mock detailed product data with vendor integrations
    const productDetails: ProductDetails = {
      id: product.id,
      name: product.name,
      description: `Premium ${product.productType} item with excellent customer ratings`,
      category: product.productType === 'apparel' ? 'Apparel & Clothing' : 'Hard Goods & Accessories',
      colors: ['Black', 'Navy', 'White', 'Heather Gray', 'Red'],
      sizes: product.productType === 'apparel' ? ['XS', 'S', 'M', 'L', 'XL', 'XXL'] : ['One Size'],
      materials: product.productType === 'apparel' ? ['100% Cotton', 'Poly-Cotton Blend'] : ['Stainless Steel', 'BPA-Free Plastic'],
      features: ['Customizable', 'Quick Turnaround', 'Bulk Pricing Available'],
      vendorIntegrations: [
        {
          vendor: 'S&S Activewear',
          sku: 'SS-' + product.sku,
          price: product.avgPrice * 0.6,
          inventory: 2500,
          leadTime: '3-5 days',
          available: true
        },
        {
          vendor: 'SanMar',
          sku: 'SM-' + product.sku,
          price: product.avgPrice * 0.65,
          inventory: 1800,
          leadTime: '2-4 days',
          available: true
        },
        {
          vendor: 'ESP',
          sku: 'ESP-' + product.sku,
          price: product.avgPrice * 0.7,
          inventory: 950,
          leadTime: '5-7 days',
          available: true
        },
        {
          vendor: 'Sage',
          sku: 'SAGE-' + product.sku,
          price: product.avgPrice * 0.55,
          inventory: 0,
          leadTime: '7-10 days',
          available: false
        }
      ],
      totalSales: product.totalQuantity,
      avgRating: 4.3 + Math.random() * 0.6,
      reviewCount: Math.floor(product.totalQuantity * 0.15)
    };

    setSelectedProduct(productDetails);
    setIsProductModalOpen(true);
  };

  const navigateToProducts = (productName: string) => {
    setLocation(`/products?search=${encodeURIComponent(productName)}`);
  };

  return {
    // State
    selectedPeriod,
    setSelectedPeriod,
    selectedProductType,
    setSelectedProductType,
    aiSearchQuery,
    setAiSearchQuery,
    selectedProduct,
    isProductModalOpen,
    setIsProductModalOpen,
    isSearching,

    // Data
    products,
    isLoading,
    suggestedProducts,
    suggestedLoading,

    // Handlers
    handleAISearch,
    handleProductClick,
    navigateToProducts,
  };
}
