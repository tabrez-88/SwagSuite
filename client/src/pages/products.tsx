import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Box, Search, Plus, DollarSign, Package, Database, ShoppingCart, Trash2, TrendingUp } from "lucide-react";
import ProductModal from "@/components/ProductModal";
import { ProductIntegrations } from "@/components/integrations/ProductIntegrations";
import { SsActivewearIntegration } from "@/components/integrations/SsActivewearIntegration";
import { PopularProducts } from "@/components/PopularProducts";

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  supplierId?: string;
  basePrice?: number;
  minimumQuantity?: number;
  colors?: string[];
  sizes?: string[];
  imprintMethods?: string[];
  leadTime?: number;
  imageUrl?: string;
}

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
}

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my-catalog");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-swag-navy">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and S&S Activewear integration
          </p>
        </div>
        <Button 
          className="bg-swag-primary hover:bg-swag-primary/90"
          onClick={() => setIsProductModalOpen(true)}
        >
          <Plus className="mr-2" size={16} />
          Add Product
        </Button>
      </div>
        
      <ProductModal 
        open={isProductModalOpen} 
        onOpenChange={setIsProductModalOpen} 
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="my-catalog" className="flex items-center gap-2">
            <Package size={16} />
            My Catalog
          </TabsTrigger>
          <TabsTrigger value="popular" className="flex items-center gap-2">
            <TrendingUp size={16} />
            Popular Items
          </TabsTrigger>
          <TabsTrigger value="ss-activewear" className="flex items-center gap-2">
            <ShoppingCart size={16} />
            S&S Activewear
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Database size={16} />
            ESP/ASI/SAGE Search
          </TabsTrigger>
        </TabsList>

        {/* My Catalog Tab */}
        <TabsContent value="my-catalog" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search products by name, description, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="whitespace-nowrap">
              {filteredProducts.length} products
            </Badge>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: Product) => {
                const supplier = suppliers.find((s: Supplier) => s.id === product.supplierId);
                
                return (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-swag-navy">{product.name}</CardTitle>
                          {product.sku && (
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {product.basePrice && (
                            <Badge className="bg-green-100 text-green-800">
                              <DollarSign size={12} className="mr-1" />
                              {product.basePrice}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      {supplier && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{supplier.name}</Badge>
                        </div>
                      )}

                      {product.colors && product.colors.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">Colors:</span>
                          <div className="flex flex-wrap gap-1">
                            {product.colors.map((color, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {color}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {product.imprintMethods && product.imprintMethods.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">Imprint Methods:</span>
                          <div className="flex flex-wrap gap-1">
                            {product.imprintMethods.map((method, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {method}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {product.minimumQuantity && (
                            <span>Min: {product.minimumQuantity}</span>
                          )}
                          {product.leadTime && (
                            <span>Lead: {product.leadTime}d</span>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          <ShoppingCart size={12} className="mr-1" />
                          Add to Quote
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Box className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No products found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Try adjusting your search terms or create a new product."
                    : "Get started by adding your first product using S&S Activewear lookup."
                  }
                </p>
                <Button onClick={() => setIsProductModalOpen(true)} className="bg-swag-primary hover:bg-swag-primary/90">
                  <Plus className="mr-2" size={16} />
                  Add Product
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Popular Products Tab */}
        <TabsContent value="popular">
          <PopularProducts />
        </TabsContent>

        {/* S&S Activewear Integration Tab */}
        <TabsContent value="ss-activewear">
          <SsActivewearIntegration />
        </TabsContent>

        {/* ESP/ASI/SAGE Integration Tab */}
        <TabsContent value="integrations">
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-900">API Integration Required</h4>
                  <p className="text-sm text-blue-700">
                    To search ESP/ASI/SAGE databases, please configure your API credentials in the Settings → Integrations tab.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <ProductIntegrations />
        </TabsContent>
      </Tabs>
    </div>
  );
}