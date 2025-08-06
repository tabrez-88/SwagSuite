import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shirt, HardHat, Package, Lightbulb, Star, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
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

export function PopularProducts() {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedProductType, setSelectedProductType] = useState<'all' | 'apparel' | 'hard_goods'>('all');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products/popular', { period: selectedPeriod, productType: selectedProductType }]
  });

  const { data: suggestedProducts = [], isLoading: suggestedLoading } = useQuery({
    queryKey: ['/api/products/suggested']
  });

  const renderProductCard = (product: PopularProduct, index: number) => (
    <div 
      key={product.id} 
      className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => setLocation(`/products?search=${encodeURIComponent(product.name)}`)}
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
    </div>
  );
}