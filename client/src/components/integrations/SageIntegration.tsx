import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Search, Package, Plus, Database, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SageProduct {
  productId: string;
  productNumber: string;
  productName: string;
  supplierName: string;
  supplierId: string;
  category: string;
  subcategory?: string;
  description: string;
  colors?: string[];
  eqpLevel?: string;
  pricingStructure?: any;
  quantityBreaks?: any[];
  decorationMethods?: string[];
  imageGallery?: string[];
  asiNumber?: string;
  dimensions?: string;
  weight?: string;
  features?: string[];
  materials?: string[];
  complianceCertifications?: string[];
}

function SageIntegrationComponent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SageProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SageProduct | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch synced SAGE products from database
  const { data: syncedProducts, isLoading: loadingProducts } = useQuery<any[]>({
    queryKey: ['/api/sage/products'],
  });

  // Test connection mutation
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

  // Search SAGE products directly from API
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

  // Sync product to database
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

  const formatPrice = (pricing: any) => {
    if (!pricing) return 'Contact for pricing';
    // Add logic to format pricing structure
    return 'See details';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">SAGE Product Search</h2>
        <p className="text-gray-600">
          Search and import products from SAGE Connect database. Make sure you've configured your SAGE credentials in Settings.
        </p>
      </div>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SAGE Connection
          </CardTitle>
          <CardDescription>
            Test your connection to SAGE API before searching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
          >
            {testConnectionMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Test Connection
          </Button>
        </CardContent>
      </Card>

      {/* Product Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search SAGE Products
          </CardTitle>
          <CardDescription>
            Search by product name, number, category, or supplier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., t-shirts, pens, drinkware..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Search Results ({searchResults.length})</h3>
              </div>
              <div className="grid gap-3 max-h-[500px] overflow-y-auto">
                {searchResults.map((product) => (
                  <Card key={product.productId} className="hover:bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-3">
                            {product.imageGallery?.[0] && (
                              <img
                                src={product.imageGallery[0]}
                                alt={product.productName}
                                className="w-20 h-20 object-cover rounded border"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{product.productName}</h4>
                              {product.pricingStructure && (product.pricingStructure as any).priceRange && (
                                <p className="text-green-600 font-semibold mt-1">
                                  ${(product.pricingStructure as any).priceRange}
                                </p>
                              )}
                              <div className="space-y-1 mt-1">
                                {product.productNumber && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Item #:</span> {product.productNumber}
                                  </p>
                                )}
                                {product.supplierName && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Supplier:</span> {product.supplierName}
                                  </p>
                                )}
                                {product.productId && (
                                  <p className="text-xs text-gray-500">
                                    <span className="font-medium">SPC:</span> {product.productId}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {product.category && product.category !== 'Uncategorized' && (
                                  <Badge variant="outline" className="text-xs">
                                    {product.category}
                                    {product.subcategory && ` - ${product.subcategory}`}
                                  </Badge>
                                )}
                                {product.eqpLevel && (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                    EQP: {product.eqpLevel}
                                  </Badge>
                                )}
                                {product.asiNumber && (
                                  <Badge variant="secondary" className="text-xs">
                                    ASI: {product.asiNumber}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {product.description && (
                            <p className="text-sm text-gray-700 line-clamp-2 pl-1">
                              {product.description}
                            </p>
                          )}

                          {/* Colors */}
                          {product.colors && product.colors.length > 0 && (
                            <div className="text-sm pl-1">
                              <span className="font-medium text-gray-700">Colors:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {product.colors.slice(0, 8).map((color, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {color}
                                  </Badge>
                                ))}
                                {product.colors.length > 8 && (
                                  <span className="text-xs text-gray-500 self-center">
                                    +{product.colors.length - 8} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 pl-1">
                            {product.dimensions && (
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                📏 {product.dimensions}
                              </span>
                            )}
                            {product.weight && (
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                ⚖️ {product.weight}
                              </span>
                            )}
                            {product.decorationMethods && product.decorationMethods.length > 0 && (
                              <span className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                                🎨 {product.decorationMethods.join(', ')}
                              </span>
                            )}
                          </div>

                          {/* Features */}
                          {product.features && product.features.length > 0 && (
                            <div className="text-xs text-gray-600 pl-1">
                              <span className="font-medium">Features:</span> {product.features.join(', ')}
                            </div>
                          )}

                          {/* Materials */}
                          {product.materials && product.materials.length > 0 && (
                            <div className="text-xs text-gray-600 pl-1">
                              <span className="font-medium">Materials:</span> {product.materials.join(', ')}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(product)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddProduct(product)}
                            disabled={syncingProducts.has(product.productId)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Catalog
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Synced Products from Database */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Your SAGE Products ({syncedProducts?.length || 0})
          </CardTitle>
          <CardDescription>
            Products synced from SAGE to your catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : syncedProducts && syncedProducts.length > 0 ? (
            <div className="grid gap-3 max-h-[400px] overflow-y-auto">
              {syncedProducts.map((product) => (
                <Card key={product.id} className="hover:bg-gray-50">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-medium">{product.productName}</h4>
                        <p className="text-sm text-gray-600">
                          {product.productNumber} • {product.brand || 'Unknown Brand'}
                        </p>
                        {product.category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Synced
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No SAGE products synced yet</p>
              <p className="text-sm">Use the search above to find and add products</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.productName}</DialogTitle>
            <DialogDescription>
              {selectedProduct?.productNumber && `Product #${selectedProduct.productNumber}`}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              {/* Product ID & Codes */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs text-gray-500">SPC Code</Label>
                  <p className="text-sm font-mono">{selectedProduct.productId}</p>
                </div>
                {selectedProduct.productNumber && (
                  <div>
                    <Label className="text-xs text-gray-500">Item Number</Label>
                    <p className="text-sm font-mono">{selectedProduct.productNumber}</p>
                  </div>
                )}
                {selectedProduct.asiNumber && (
                  <div>
                    <Label className="text-xs text-gray-500">ASI Number</Label>
                    <p className="text-sm font-mono">{selectedProduct.asiNumber}</p>
                  </div>
                )}
                {selectedProduct.supplierId && (
                  <div>
                    <Label className="text-xs text-gray-500">Supplier ID</Label>
                    <p className="text-sm font-mono">{selectedProduct.supplierId}</p>
                  </div>
                )}
              </div>

              {/* Images */}
              {selectedProduct.imageGallery && selectedProduct.imageGallery.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Product Images</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.imageGallery.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${selectedProduct.productName} ${idx + 1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Main Details */}
              <div className="space-y-4">
                {/* Pricing */}
                {selectedProduct.pricingStructure && (selectedProduct.pricingStructure as any).priceRange && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <Label className="text-sm font-semibold text-green-800">Pricing</Label>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      ${(selectedProduct.pricingStructure as any).priceRange}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Price varies by quantity</p>
                  </div>
                )}

                {selectedProduct.supplierName && (
                  <div>
                    <Label className="text-sm font-semibold">Supplier</Label>
                    <p className="text-sm mt-1">{selectedProduct.supplierName}</p>
                  </div>
                )}

                {selectedProduct.category && selectedProduct.category !== 'Uncategorized' && (
                  <div>
                    <Label className="text-sm font-semibold">Category</Label>
                    <p className="text-sm mt-1">
                      {selectedProduct.category}
                      {selectedProduct.subcategory && ` > ${selectedProduct.subcategory}`}
                    </p>
                  </div>
                )}

                {selectedProduct.description && (
                  <div>
                    <Label className="text-sm font-semibold">Description</Label>
                    <p className="text-sm mt-1 text-gray-700">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Specifications */}
                {(selectedProduct.dimensions || selectedProduct.weight) && (
                  <div>
                    <Label className="text-sm font-semibold">Specifications</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {selectedProduct.dimensions && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Dimensions:</span>
                          <span>{selectedProduct.dimensions}</span>
                        </div>
                      )}
                      {selectedProduct.weight && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Weight:</span>
                          <span>{selectedProduct.weight}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Features */}
                {selectedProduct.features && selectedProduct.features.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Features</Label>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1 text-gray-700">
                      {selectedProduct.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Materials */}
                {selectedProduct.materials && selectedProduct.materials.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Materials</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedProduct.materials.map((material, idx) => (
                        <Badge key={idx} variant="outline">{material}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decoration Methods */}
                {selectedProduct.decorationMethods && selectedProduct.decorationMethods.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Decoration Methods</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedProduct.decorationMethods.map((method, idx) => (
                        <Badge key={idx} variant="secondary">{method}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* EQP Level */}
                {selectedProduct.eqpLevel && (
                  <div>
                    <Label className="text-sm font-semibold">EQP Rating</Label>
                    <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                      {selectedProduct.eqpLevel}
                    </Badge>
                  </div>
                )}

                {/* Certifications */}
                {selectedProduct.complianceCertifications && selectedProduct.complianceCertifications.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Certifications</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedProduct.complianceCertifications.map((cert, idx) => (
                        <Badge key={idx} className="bg-green-100 text-green-800">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add to Catalog Button */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleAddProduct(selectedProduct);
                    setIsDetailModalOpen(false);
                  }}
                  disabled={selectedProduct ? syncingProducts.has(selectedProduct.productId) : false}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Catalog
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { SageIntegrationComponent as SageIntegration };
export default SageIntegrationComponent;
