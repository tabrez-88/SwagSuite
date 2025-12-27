import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ProductIntegrations } from "@/components/integrations/ProductIntegrations";
import { SsActivewearIntegration } from "@/components/integrations/SsActivewearIntegration";
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
import { Box, Search, Plus, DollarSign, Package, Database, ShoppingCart, Trash2 } from "lucide-react";
import ProductModal from "@/components/ProductModal";

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
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
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
      basePrice: 0,
      minimumQuantity: 1,
      colors: "",
      sizes: "",
      imprintMethods: "",
      leadTime: 0,
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-swag-navy">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and ESP/ASI/SAGE integrations
          </p>
        </div>
        <Button
          className="bg-swag-primary hover:bg-swag-primary/90"
          onClick={() => setIsProductModalOpen(true)}
        >
          <Plus className="mr-2" size={16} />
          Add Product
        </Button>

        <ProductModal
          open={isProductModalOpen}
          onOpenChange={setIsProductModalOpen}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="Enter SKU" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter product description"
                  rows={3}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minimumQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Quantity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="leadTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Time (days)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="7" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="colors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Colors</FormLabel>
                <FormControl>
                  <Input placeholder="Red, Blue, Green" {...field} />
                </FormControl>
                <FormDescription>Separate with commas</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sizes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sizes</FormLabel>
                <FormControl>
                  <Input placeholder="S, M, L, XL" {...field} />
                </FormControl>
                <FormDescription>Separate with commas</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imprintMethods"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imprint Methods</FormLabel>
                <FormControl>
                  <Input placeholder="Screen Print, Embroidery" {...field} />
                </FormControl>
                <FormDescription>Separate with commas</FormDescription>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createProductMutation.isPending}
            className="bg-swag-primary hover:bg-swag-primary/90"
          >
            {createProductMutation.isPending ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
            </DialogContent >
          </Dialog >
        </div >

    {/* Main Content */ }
    < Tabs v a l ue = { activ eTab } onValueCh a n ge = { setActiv eTab } class N ame = "space- y-4" >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="my-catalog" className="flex items-center gap-2">
          <Package size={16} />
          My Catalog
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

  {/* My Catalog Tab */ }
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
              : "Get started by adding your first product or searching ESP/ASI/SAGE databases."
            }
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-swag-primary hover:bg-swag-primary/90">
            <Plus className="mr-2" size={16} />
            Add Product
          </Button>
        </CardContent>
      </Card>
    )}
  </TabsContent>

  {/* S&S Activewear Integration Tab */ }
  <TabsContent value="ss-activewear">
    <SsActivewearIntegration />
  </TabsContent>

  {/* ESP/ASI/SAGE Integration Tab */ }
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
        </Tabs >
    </div >
  );
}