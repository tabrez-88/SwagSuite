import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Package, Shirt, HardHat, TrendingUp, Lightbulb, Percent, Star, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";

interface PopularProduct {
  id: string;
  name: string;
  sku: string;
  imageUrl?: string;
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
  imageUrl?: string;
  productType: 'apparel' | 'hard_goods';
  presentationCount: number;
  avgPresentationPrice: number;
  discount: number;
  adminNote: string;
  isAdminSuggested: boolean;
}

interface PopularProductsProps {
  title?: string;
  productType?: 'all' | 'apparel' | 'hard_goods';
  showFilters?: boolean;
  compact?: boolean;
}

export function PopularProducts({ 
  title = "Most Popular Items", 
  productType = 'all',
  showFilters = true,
  compact = false 
}: PopularProductsProps) {
  const [period, setPeriod] = useState('ytd');
  const [selectedProductType, setSelectedProductType] = useState(productType);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const { data: products = [], isLoading } = useQuery<PopularProduct[]>({
    queryKey: ['/api/products/popular', period, selectedProductType, customStartDate, customEndDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        productType: selectedProductType,
      });
      
      if (period === 'custom' && customStartDate && customEndDate) {
        params.set('startDate', customStartDate);
        params.set('endDate', customEndDate);
      }
      
      const response = await fetch(`/api/products/popular?${params}`);
      if (!response.ok) throw new Error('Failed to fetch popular products');
      return response.json();
    }
  });

  const { data: suggestedProducts = [], isLoading: suggestedLoading } = useQuery<SuggestedProduct[]>({
    queryKey: ['/api/products/suggested', selectedProductType],
    queryFn: async () => {
      const params = new URLSearchParams({
        productType: selectedProductType,
      });
      
      const response = await fetch(`/api/products/suggested?${params}`);
      if (!response.ok) throw new Error('Failed to fetch suggested products');
      return response.json();
    }
  });

  const renderProductCard = (product: PopularProduct, index: number) => (
    <Link key={product.id} href={`/products?search=${product.sku}`}>
      <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors cursor-pointer">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-swag-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-swag-primary">#{index + 1}</span>
          </div>
        </div>
        
        {/* Product Image */}
        <div className="flex-shrink-0">
          <img 
            src={product.imageUrl || '/public-objects/products/placeholder.jpg'} 
            alt={product.name}
            className="w-12 h-12 object-cover rounded-lg border"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/public-objects/products/placeholder.jpg';
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
            </div>
            <Badge variant={product.productType === 'apparel' ? 'default' : 'secondary'} className="ml-2">
              {product.productType === 'apparel' ? <Shirt className="w-3 h-3 mr-1" /> : <HardHat className="w-3 h-3 mr-1" />}
              {product.productType === 'apparel' ? 'Apparel' : 'Hard Goods'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-600">
              <span className="font-medium">{product.totalQuantity.toLocaleString()}</span> units ordered
            </div>
            <div className="text-xs text-green-600 font-medium">
              ${product.totalRevenue.toLocaleString()}
            </div>
          </div>
          
          {!compact && (
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span>{product.orderCount} orders</span>
              <span>Avg: ${product.avgPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  const renderSuggestedCard = (product: SuggestedProduct, index: number) => (
    <div key={product.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-blue-600" />
        </div>
      </div>
      
      {/* Product Image */}
      <Link href={`/products?search=${product.sku}`} className="flex-shrink-0">
        <img 
          src={product.imageUrl || '/public-objects/products/placeholder.jpg'} 
          alt={product.name}
          className="w-12 h-12 object-cover rounded-lg border hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/public-objects/products/placeholder.jpg';
          }}
        />
      </Link>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Link href={`/products?search=${product.sku}`} className="hover:text-blue-600 transition-colors">
              <p className="text-sm font-medium text-gray-900 truncate cursor-pointer">{product.name}</p>
            </Link>
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
          </div>
          <div className="flex items-center gap-2">
            {product.isAdminSuggested && (
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                <Star className="w-3 h-3 mr-1" />
                Staff Pick
              </Badge>
            )}
            <Badge variant={product.productType === 'apparel' ? 'default' : 'secondary'}>
              {product.productType === 'apparel' ? <Shirt className="w-3 h-3 mr-1" /> : <HardHat className="w-3 h-3 mr-1" />}
              {product.productType === 'apparel' ? 'Apparel' : 'Hard Goods'}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-blue-600">
            {product.isAdminSuggested ? (
              <span>Admin suggested</span>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/reports?filter=presentations&product=${product.sku}`;
                }}
              >
                <span className="font-medium">{product.presentationCount}</span> presentations
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {product.discount > 0 && (
              <div className="flex items-center text-xs text-green-600 font-medium">
                <Percent className="w-3 h-3 mr-1" />
                {product.discount}% off
              </div>
            )}
            <div className="text-xs text-gray-600">
              ${product.avgPresentationPrice.toFixed(2)}
            </div>
          </div>
        </div>
        
        {product.adminNote && (
          <div className="mt-1 text-xs text-blue-600 italic">
            {product.adminNote}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="period">Time Period</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wtd">Week to Date</SelectItem>
                    <SelectItem value="mtd">Month to Date</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="productType">Product Type</Label>
                <Select value={selectedProductType} onValueChange={setSelectedProductType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="apparel">Apparel Only</SelectItem>
                    <SelectItem value="hard_goods">Hard Goods Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {period === 'custom' && (
                <>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Separate sections for Apparel and Hard Goods when showing all */}
      {selectedProductType === 'all' ? (
        <div className="space-y-6">
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
                  <div className="space-y-3 max-h-[258px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
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
                  <div className="space-y-3 max-h-[258px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {products
                      .filter(p => p.productType === 'apparel')
                      .slice(0, 10)
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
                  <div className="space-y-3 max-h-[258px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
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
                  <div className="space-y-3 max-h-[258px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {products
                      .filter(p => p.productType === 'hard_goods')
                      .slice(0, 10)
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
                  <div className="space-y-3 max-h-[258px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
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
                  <div className="space-y-3 max-h-[258px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {suggestedProducts
                      .filter(p => p.productType === 'apparel')
                      .slice(0, 10)
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
                  <div className="space-y-3 max-h-[258px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
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
                  <div className="space-y-3 max-h-[258px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {suggestedProducts
                      .filter(p => p.productType === 'hard_goods')
                      .slice(0, 10)
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
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
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
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {products.slice(0, 10).map((product, index) => renderProductCard(product, index))}
                  {products.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No products found for this period</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Items for Specific Product Type */}
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
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
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
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {suggestedProducts.slice(0, 10).map((product, index) => renderSuggestedCard(product, index))}
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
    </div>
  );
}