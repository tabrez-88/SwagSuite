import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Package, Shirt, HardHat, TrendingUp } from "lucide-react";

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

  const renderProductCard = (product: PopularProduct, index: number) => (
    <div key={product.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-white">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-swag-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-sm font-bold text-swag-primary">#{index + 1}</span>
        </div>
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
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {products
                    .filter(p => p.productType === 'apparel')
                    .slice(0, 5)
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
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {products
                    .filter(p => p.productType === 'hard_goods')
                    .slice(0, 5)
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
      ) : (
        /* Single section for specific product type */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedProductType === 'apparel' ? <Shirt className="w-5 h-5" /> : <HardHat className="w-5 h-5" />}
              Most Popular {selectedProductType === 'apparel' ? 'Apparel' : 'Hard Goods'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
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
      )}
    </div>
  );
}