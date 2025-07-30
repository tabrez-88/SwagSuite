import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/Layout";
import { ProductIntegrations } from "@/components/integrations/ProductIntegrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Box, Search, Plus, DollarSign, Package, Database, ShoppingCart, Edit, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  supplierSku?: string;
  basePrice?: number;
  minimumQuantity?: number;
  colors?: string[];
  sizes?: string[];
  imprintMethods?: string[];
  leadTime?: number;
  imageUrl?: string;
  supplierId?: string;
  categoryId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
}

// Form schema for product creation
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  supplierId: z.string().optional(),
  categoryId: z.string().optional(),
  basePrice: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  minimumQuantity: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  colors: z.string().optional(),
  sizes: z.string().optional(),
  imprintMethods: z.string().optional(),
  leadTime: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my-catalog");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      supplierId: "",
      categoryId: "",
      basePrice: "",
      minimumQuantity: "1",
      colors: "",
      sizes: "",
      imprintMethods: "",
      leadTime: "",
      imageUrl: "",
    },
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const processedData = {
        ...data,
        colors: data.colors ? data.colors.split(",").map(c => c.trim()).filter(c => c) : [],
        sizes: data.sizes ? data.sizes.split(",").map(s => s.trim()).filter(s => s) : [],
        imprintMethods: data.imprintMethods ? data.imprintMethods.split(",").map(m => m.trim()).filter(m => m) : [],
      };
      return await apiRequest("/api/products", "POST", processedData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsCreateModalOpen(false);
      form.reset();
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
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest(`/api/products/${productId}`, "DELETE");
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

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

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
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-swag-blue" />
            <div>
              <h1 className="text-3xl font-bold text-swag-navy">Product Management</h1>
              <p className="text-muted-foreground">
                Search ESP/ASI/SAGE databases and manage your product catalog
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              ESP/ASI/SAGE Search
            </TabsTrigger>
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              My Catalog ({filteredProducts?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="integrations">
            <ProductIntegrations />
          </TabsContent>

          <TabsContent value="catalog" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-swag-navy">My Product Catalog</h2>
                <p className="text-muted-foreground">
                  Manage your imported and custom promotional products
                </p>
              </div>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-swag-blue hover:bg-swag-blue/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Custom Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreate}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          value={newProduct.name}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sku">SKU</Label>
                        <Input
                          id="sku"
                          value={newProduct.sku}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, sku: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="supplierId">Supplier</Label>
                        <Select
                          value={newProduct.supplierId}
                          onValueChange={(value) =>
                            setNewProduct({ ...newProduct, supplierId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers?.map((supplier: Supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="basePrice">Base Price</Label>
                        <Input
                          id="basePrice"
                          type="number"
                          step="0.01"
                          value={newProduct.basePrice}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, basePrice: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="minimumQuantity">Minimum Quantity</Label>
                        <Input
                          id="minimumQuantity"
                          type="number"
                          value={newProduct.minimumQuantity}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, minimumQuantity: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newProduct.description}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, description: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProductMutation.isPending}>
                        {createProductMutation.isPending ? "Creating..." : "Create Product"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search your catalog..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "No products match your search criteria."
                      : "Import products from ESP/ASI/SAGE or add custom products to get started."}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Product
                    </Button>
                  </div>
                </div>
              ) : (
                filteredProducts.map((product: Product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {suppliers?.find((s: Supplier) => s.id === product.supplierId)?.name || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">${product.basePrice}</span>
                        <span className="text-sm text-muted-foreground">
                          (Min: {product.minimumQuantity})
                        </span>
                      </div>

                      {product.colors && product.colors.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Colors:</span>
                          <div className="flex gap-1">
                            {product.colors.slice(0, 4).map((color, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {color}
                              </Badge>
                            ))}
                            {product.colors.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{product.colors.length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {product.imprintMethods && product.imprintMethods.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Methods:</span>
                          <div className="flex gap-1">
                            {product.imprintMethods.slice(0, 2).map((method, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {method}
                              </Badge>
                            ))}
                            {product.imprintMethods.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{product.imprintMethods.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {product.leadTime && (
                        <p className="text-xs text-muted-foreground">
                          Lead time: {product.leadTime}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}