import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Box, Search, Plus, DollarSign, Package } from "lucide-react";
import type { Product, Supplier } from "@shared/schema";

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    sku: "",
    supplierId: "",
    basePrice: "",
    minimumQuantity: "1",
    colors: "",
    sizes: "",
    imprintMethods: "",
    leadTime: "",
    imageUrl: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsCreateModalOpen(false);
      setNewProduct({
        name: "",
        description: "",
        sku: "",
        supplierId: "",
        basePrice: "",
        minimumQuantity: "1",
        colors: "",
        sizes: "",
        imprintMethods: "",
        leadTime: "",
        imageUrl: "",
      });
    },
    onError: (error: Error) => {
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
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      ...newProduct,
      basePrice: newProduct.basePrice ? parseFloat(newProduct.basePrice) : null,
      minimumQuantity: parseInt(newProduct.minimumQuantity) || 1,
      leadTime: newProduct.leadTime ? parseInt(newProduct.leadTime) : null,
    };

    createProductMutation.mutate(productData);
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers?.find((s: Supplier) => s.id === supplierId);
    return supplier?.name || "Unknown Supplier";
  };

  const filteredProducts = products?.filter((product: Product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog and inventory</p>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-swag-primary hover:bg-swag-primary/90">
                <Plus className="mr-2" size={20} />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Product SKU"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select 
                      value={newProduct.supplierId} 
                      onValueChange={(value) => setNewProduct(prev => ({ ...prev, supplierId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier..." />
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
                      onChange={(e) => setNewProduct(prev => ({ ...prev, basePrice: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimumQuantity">Minimum Quantity</Label>
                    <Input
                      id="minimumQuantity"
                      type="number"
                      value={newProduct.minimumQuantity}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, minimumQuantity: e.target.value }))}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="leadTime">Lead Time (days)</Label>
                    <Input
                      id="leadTime"
                      type="number"
                      value={newProduct.leadTime}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, leadTime: e.target.value }))}
                      placeholder="7"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Product description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="colors">Available Colors</Label>
                    <Input
                      id="colors"
                      value={newProduct.colors}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, colors: e.target.value }))}
                      placeholder="Red, Blue, Green"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sizes">Available Sizes</Label>
                    <Input
                      id="sizes"
                      value={newProduct.sizes}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, sizes: e.target.value }))}
                      placeholder="S, M, L, XL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imprintMethods">Imprint Methods</Label>
                    <Input
                      id="imprintMethods"
                      value={newProduct.imprintMethods}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, imprintMethods: e.target.value }))}
                      placeholder="Embroidery, Screen Print"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-swag-primary hover:bg-swag-primary/90"
                    disabled={createProductMutation.isPending}
                  >
                    {createProductMutation.isPending ? "Creating..." : "Create Product"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Product Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-xl font-bold">{products?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="text-green-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Avg. Price</p>
                  <p className="text-xl font-bold">
                    ${products?.length ? 
                      (products.reduce((sum: number, p: Product) => sum + Number(p.basePrice || 0), 0) / products.length).toFixed(2) 
                      : '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Box className="text-purple-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">With Images</p>
                  <p className="text-xl font-bold">
                    {products?.filter((p: Product) => p.imageUrl).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Box className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No products found" : "No products yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? `No products match "${searchQuery}"`
                  : "Start building your product catalog by adding your first product"
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-swag-primary hover:bg-swag-primary/90"
                >
                  <Plus className="mr-2" size={20} />
                  Add First Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product: Product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Product Image */}
                  <div className="mb-4">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center ${product.imageUrl ? 'hidden' : ''}`}>
                      <Box className="text-gray-400" size={32} />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.sku && (
                        <Badge variant="outline" className="ml-2">
                          {product.sku}
                        </Badge>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="space-y-1">
                      {product.supplierId && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Supplier:</span> {getSupplierName(product.supplierId)}
                        </p>
                      )}

                      {product.basePrice && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Price:</span> ${Number(product.basePrice).toFixed(2)}
                        </p>
                      )}

                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Min Qty:</span> {product.minimumQuantity || 1}
                      </p>

                      {product.leadTime && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Lead Time:</span> {product.leadTime} days
                        </p>
                      )}
                    </div>

                    {/* Colors and Sizes */}
                    <div className="space-y-1">
                      {product.colors && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Colors:</p>
                          <p className="text-xs text-gray-600">{product.colors}</p>
                        </div>
                      )}
                      {product.sizes && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Sizes:</p>
                          <p className="text-xs text-gray-600">{product.sizes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
