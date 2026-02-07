import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Search, RefreshCw, Eye, ShoppingCart, DollarSign, Package, Zap, Award, Palette, Ruler } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProductSearchResult {
  id: string;
  sourceSystem: 'esp' | 'sage' | 'dc';
  productName: string;
  supplierName: string;
  category: string;
  description: string;
  minPrice: number;
  maxPrice: number;
  minQuantity: number;
  decorationMethods: string[];
  colors: string[];
  primaryImage?: string;
  qualityScore: number;
  popularityScore: number;
  asiNumber?: string;
  eqpLevel?: string;
}

interface IntegrationConfig {
  id: string;
  integration: string;
  displayName: string;
  syncEnabled: boolean;
  isHealthy: boolean;
  totalSyncs: number;
  totalRecordsSynced: number;
  status: string;
}

interface ProductSearchResponse {
  results: ProductSearchResult[];
  totalFound: number;
  searchTime: string;
}

export function ProductIntegrations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch integration configurations
  const { data: configs, isLoading: configsLoading } = useQuery<IntegrationConfig[]>({
    queryKey: ['/api/integrations/configurations'],
  });

  // Search products across all platforms
  const { data: searchResults, isLoading: searchLoading, refetch: searchProducts } = useQuery<ProductSearchResponse>({
    queryKey: ['/api/integrations/products/search', { query: searchQuery, source: selectedSource, category: selectedCategory }],
    enabled: false, // Only search when explicitly triggered
  });

  // Sync mutation
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

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'esp': return 'bg-blue-100 text-blue-800';
      case 'sage': return 'bg-green-100 text-green-800';
      case 'dc': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-swag-navy">ESP/ASI/SAGE Integration</h2>
          <p className="text-muted-foreground">
            Search and import products from promotional industry databases
          </p>
        </div>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {configsLoading ? (
          <div className="col-span-3 text-center py-8">Loading integration status...</div>
        ) : (
          configs?.map((config) => (
            <Card key={config.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{config.displayName}</CardTitle>
                  <div className="flex items-center gap-2">
                    {config.isHealthy ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <Badge variant={config.syncEnabled ? "default" : "secondary"}>
                      {config.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Syncs:</span>
                    <span className="font-medium">{config.totalSyncs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Records Synced:</span>
                    <span className="font-medium">{config.totalRecordsSynced.toLocaleString()}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSync(config.integration)}
                    disabled={syncMutation.isPending}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Product Search
          </CardTitle>
          <CardDescription>
            Search across ESP, SAGE, and Distributor Central databases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search Query</Label>
              <Input
                placeholder="Enter product name, category, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <Label>Source Platform</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="esp">ESP/ASI</SelectItem>
                  <SelectItem value="sage">SAGE</SelectItem>
                  <SelectItem value="dc">Distributor Central</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="drinkware">Drinkware</SelectItem>
                  <SelectItem value="apparel">Apparel</SelectItem>
                  <SelectItem value="bags">Bags</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="writing">Writing Instruments</SelectItem>
                  <SelectItem value="outdoor">Outdoor & Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={searchLoading} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchResults?.totalFound || 0} products in {searchResults?.searchTime || '0s'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults?.results?.map((product: ProductSearchResult) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">{product.productName}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{product.supplierName}</p>
                      </div>
                      <Badge className={getSourceBadgeColor(product.sourceSystem)}>
                        {product.sourceSystem.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{product.category}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{formatPrice(product.minPrice)} - {formatPrice(product.maxPrice)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>Min: {product.minQuantity} pcs</span>
                    </div>

                    {product.eqpLevel && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span>EQP: {product.eqpLevel}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {product.decorationMethods.slice(0, 2).map((method) => (
                        <Badge key={method} variant="outline" className="text-xs">
                          {method}
                        </Badge>
                      ))}
                      {product.decorationMethods.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.decorationMethods.length - 2} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {product.colors.slice(0, 3).map((color) => (
                        <div
                          key={color}
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.toLowerCase() }}
                          title={color}
                        />
                      ))}
                      {product.colors.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{product.colors.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{product.productName}</DialogTitle>
                            <DialogDescription>{product.supplierName}</DialogDescription>
                          </DialogHeader>
                          <ProductDetailView product={product} />
                        </DialogContent>
                      </Dialog>
                      
                      <Button size="sm" className="flex-1">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Import
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProductDetailView({ product }: { product: ProductSearchResult }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Product Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span>{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source:</span>
                <Badge className={getSourceBadgeColor(product.sourceSystem)}>
                  {product.sourceSystem.toUpperCase()}
                </Badge>
              </div>
              {product.asiNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ASI Number:</span>
                  <span>{product.asiNumber}</span>
                </div>
              )}
              {product.eqpLevel && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EQP Level:</span>
                  <span>{product.eqpLevel}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Pricing & Quantities</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Range:</span>
                <span>{formatPrice(product.minPrice)} - {formatPrice(product.maxPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum Order:</span>
                <span>{product.minQuantity} pieces</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality Score:</span>
                <span>{product.qualityScore}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Popularity:</span>
                <span>{product.popularityScore}/100</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Decoration Methods</h3>
            <div className="flex flex-wrap gap-1">
              {product.decorationMethods.map((method) => (
                <Badge key={method} variant="outline">
                  {method}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Available Colors</h3>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <div key={color} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.toLowerCase() }}
                  />
                  <span className="text-sm">{color}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSourceBadgeColor(source: string) {
  switch (source) {
    case 'esp': return 'bg-blue-100 text-blue-800';
    case 'sage': return 'bg-green-100 text-green-800';
    case 'dc': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}