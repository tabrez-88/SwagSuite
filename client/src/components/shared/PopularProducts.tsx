import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Shirt, HardHat, Package, Lightbulb, Star, TrendingUp, Calendar, ExternalLink, Search, Bot, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'wouter';

interface PopularProduct {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  productType: 'apparel' | 'hard_goods';
  totalQuantity: number;
  orderCount: number;
  avgPrice: number;
  totalRevenue: number;
}

interface SuggestedProduct {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  productType: 'apparel' | 'hard_goods';
  presentationCount: number;
  avgPresentationPrice: number;
  discount: number;
  adminNote: string;
  isAdminSuggested: boolean;
}

interface VendorIntegration {
  vendor: string;
  sku: string;
  price: number;
  inventory: number;
  leadTime: string;
  available: boolean;
}

interface ProductDetails {
  id: string;
  name: string;
  description: string;
  category: string;
  colors: string[];
  sizes: string[];
  materials: string[];
  features: string[];
  vendorIntegrations: VendorIntegration[];
  totalSales: number;
  avgRating: number;
  reviewCount: number;
}

export function PopularProducts() {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedProductType, setSelectedProductType] = useState<'all' | 'apparel' | 'hard_goods'>('all');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products/popular', { period: selectedPeriod, productType: selectedProductType }]
  });

  const { data: suggestedProducts = [], isLoading: suggestedLoading } = useQuery({
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

  const renderProductCard = (product: PopularProduct, index: number) => (
    <div 
      key={product.id} 
      className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => handleProductClick(product)}
      data-testid={`product-card-${product.id}`}
    >
      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-lg font-medium text-sm">
        {index + 1}
      </div>
      {product.imageUrl ? (
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-12 h-12 object-cover rounded-lg border"
        />
      ) : (
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          {product.productType === 'apparel' ? (
            <Shirt className="w-6 h-6 text-gray-400" />
          ) : (
            <HardHat className="w-6 h-6 text-gray-400" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{product.name}</h4>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{product.sku}</span>
          <span>•</span>
          <span>{product.totalQuantity} sold</span>
          <span>•</span>
          <span>${product.totalRevenue.toLocaleString()}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-sm">${product.avgPrice.toFixed(2)}</p>
      </div>
    </div>
  );

  const renderSuggestedCard = (product: SuggestedProduct, index: number) => (
    <div key={product.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm">
        {index + 1}
      </div>
      {product.imageUrl ? (
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-12 h-12 object-cover rounded-lg border"
        />
      ) : (
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          {product.productType === 'apparel' ? (
            <Shirt className="w-6 h-6 text-gray-400" />
          ) : (
            <HardHat className="w-6 h-6 text-gray-400" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 
            className="font-medium text-sm truncate cursor-pointer hover:text-blue-600"
            onClick={() => setLocation(`/products?search=${encodeURIComponent(product.name)}`)}
          >
            {product.name}
          </h4>
          {product.isAdminSuggested && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Star className="w-3 h-3" />
              Admin Pick
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{product.sku}</span>
          <span>•</span>
          <span>{product.presentationCount} presentations</span>
          {product.discount > 0 && (
            <>
              <span>•</span>
              <span className="text-green-600 font-medium">
                {product.discount}% off
              </span>
            </>
          )}
        </div>
        {product.adminNote && (
          <p className="text-xs text-gray-400 mt-1">{product.adminNote}</p>
        )}
      </div>
      <div className="text-right">
        <p className="font-medium text-sm">${product.avgPresentationPrice.toFixed(2)}</p>
        {product.discount > 0 && (
          <p className="text-xs text-green-600">{product.discount}% off</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* AI Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Product Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Ask AI: 'What tumblers are our best selling with 100+ quantity?' or 'Show me popular apparel under $20'"
                value={aiSearchQuery}
                onChange={(e) => setAiSearchQuery(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
                data-testid="ai-search-input"
              />
            </div>
            <Button 
              onClick={handleAISearch}
              disabled={!aiSearchQuery.trim() || isSearching}
              className="flex items-center gap-2"
              data-testid="ai-search-button"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  AI Search
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Use natural language to find products from our vendor integrations (S&S, SanMar, ESP, Sage)
          </p>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500" />
          <Select value={selectedProductType} onValueChange={(value: 'all' | 'apparel' | 'hard_goods') => setSelectedProductType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="apparel">Apparel Only</SelectItem>
              <SelectItem value="hard_goods">Hard Goods Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProductType === 'all' ? (
        /* Two-column layout for all products */
        <div className="space-y-6">
          {/* Popular Products Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Apparel Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shirt className="w-5 h-5" />
                  Most Popular Apparel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {products
                      .filter(p => p.productType === 'apparel')
                      .map((product, index) => renderProductCard(product, index))}
                    {products.filter(p => p.productType === 'apparel').length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No apparel items found for this period</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hard Goods Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardHat className="w-5 h-5" />
                  Most Popular Hard Goods
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {products
                      .filter(p => p.productType === 'hard_goods')
                      .map((product, index) => renderProductCard(product, index))}
                    {products.filter(p => p.productType === 'hard_goods').length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No hard goods found for this period</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Suggested Items Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Suggested Apparel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  Suggested Apparel
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Items from presentations that haven't been sold yet</p>
              </CardHeader>
              <CardContent>
                {suggestedLoading ? (
                  <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {suggestedProducts
                      .filter(p => p.productType === 'apparel')
                      .map((product, index) => renderSuggestedCard(product, index))}
                    {suggestedProducts.filter(p => p.productType === 'apparel').length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No suggested apparel items</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggested Hard Goods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  Suggested Hard Goods
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Items from presentations that haven't been sold yet</p>
              </CardHeader>
              <CardContent>
                {suggestedLoading ? (
                  <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {suggestedProducts
                      .filter(p => p.productType === 'hard_goods')
                      .map((product, index) => renderSuggestedCard(product, index))}
                    {suggestedProducts.filter(p => p.productType === 'hard_goods').length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No suggested hard goods</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Single section for specific product type */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedProductType === 'apparel' ? <Shirt className="w-5 h-5" /> : <HardHat className="w-5 h-5" />}
                Most Popular {selectedProductType === 'apparel' ? 'Apparel' : 'Hard Goods'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                  {products.map((product, index) => renderProductCard(product, index))}
                  {products.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No {selectedProductType === 'apparel' ? 'apparel' : 'hard goods'} found for this period</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Items for single product type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                Suggested {selectedProductType === 'apparel' ? 'Apparel' : 'Hard Goods'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Items from presentations that haven't been sold yet</p>
            </CardHeader>
            <CardContent>
              {suggestedLoading ? (
                <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                  {suggestedProducts.map((product, index) => renderSuggestedCard(product, index))}
                  {suggestedProducts.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No suggested {selectedProductType === 'apparel' ? 'apparel' : 'hard goods'} items</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Product Details Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                    <p className="text-sm text-gray-500 font-normal">{selectedProduct.category}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {selectedProduct.totalSales} units sold
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedProduct.description}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Product Information */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Available Colors</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.colors.map((color) => (
                            <Badge key={color} variant="secondary" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Available Sizes</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.sizes.map((size) => (
                            <Badge key={size} variant="outline" className="text-xs">
                              {size}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Materials</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.materials.map((material) => (
                            <Badge key={material} variant="secondary" className="text-xs">
                              {material}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Features</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{selectedProduct.avgRating.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({selectedProduct.reviewCount} reviews)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Vendor Integrations */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Vendor Integrations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedProduct.vendorIntegrations.map((vendor) => (
                          <div
                            key={vendor.vendor}
                            className={`border rounded-lg p-4 ${
                              vendor.available ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{vendor.vendor}</h4>
                                <Badge 
                                  variant={vendor.available ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {vendor.available ? "Available" : "Out of Stock"}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">${vendor.price.toFixed(2)}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">SKU:</p>
                                <p className="font-medium">{vendor.sku}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Lead Time:</p>
                                <p className="font-medium">{vendor.leadTime}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Inventory:</p>
                                <p className="font-medium">
                                  {vendor.inventory > 0 ? vendor.inventory.toLocaleString() : "Out of Stock"}
                                </p>
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  variant={vendor.available ? "default" : "secondary"}
                                  disabled={!vendor.available}
                                  className="flex items-center gap-2"
                                  data-testid={`vendor-select-${vendor.vendor.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {vendor.available ? "Select" : "Unavailable"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />
                      
                      <div className="text-center">
                        <Button className="w-full" data-testid="create-order-button">
                          <Package className="w-4 h-4 mr-2" />
                          Create Order with Selected Vendor
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          Choose a vendor above to proceed with order creation
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}