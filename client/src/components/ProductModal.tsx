import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Loader2, Search } from "lucide-react";
import type { Supplier } from "@shared/schema";

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

interface SsActivewearProduct {
  sku: string;
  gtin: string;
  styleID: number;
  brandName: string;
  styleName: string;
  colorName: string;
  colorCode: string;
  sizeName: string;
  sizeCode: string;
  unitWeight: number;
  caseQty: number;
  piecePrice: number;
  dozenPrice: number;
  casePrice: number;
  customerPrice: number;
  qty: number;
  colorFrontImage: string;
  colorBackImage: string;
  colorSideImage: string;
  colorSwatchImage: string;
  countryOfOrigin: string;
}

export default function ProductModal({ open, onOpenChange, product }: ProductModalProps) {
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    price: "",
    supplierId: "",
    category: "",
    brand: "",
    style: "",
    color: "",
    size: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SsActivewearProduct[]>([]);
  const [selectedProductImage, setSelectedProductImage] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: open,
  });

  // Populate form when editing existing product
  useEffect(() => {
    if (product && open) {
      setFormData({
        sku: product.sku || "",
        name: product.name || "",
        description: product.description || "",
        price: product.basePrice?.toString() || "",
        supplierId: product.supplierId || "",
        category: "",
        brand: "",
        style: "",
        color: product.colors?.[0] || "",
        size: product.sizes?.[0] || "",
      });
      setSelectedProductImage(product.imageUrl || "");
    } else if (!product && open) {
      resetForm();
    }
  }, [product, open]);

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      description: "",
      price: "",
      supplierId: "",
      category: "",
      brand: "",
      style: "",
      color: "",
      size: "",
    });
    setSelectedProductImage("");
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
  };

  const searchProductMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/ss-activewear/search?query=${encodeURIComponent(query)}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No products found in S&S Activewear catalog");
        }
        throw new Error("Failed to search products");
      }

      return response.json() as Promise<SsActivewearProduct[]>;
    },
    onSuccess: (products) => {
      setSearchResults(products);
      setSearchError("");

      if (products.length === 1) {
        // If only one product found, auto-populate the form
        const product = products[0];

        // Try to find S&S Activewear in the suppliers list to auto-select
        const ssSupplier = suppliers.find(s => s.name.toLowerCase().includes("s&s activewear") || s.name.toLowerCase().includes("ss activewear"));

        setFormData({
          sku: product.sku,
          name: `${product.brandName} ${product.styleName} - ${product.colorName}`,
          description: `${product.brandName} ${product.styleName} in ${product.colorName}, Size: ${product.sizeName}`,
          price: product.piecePrice?.toString() || "",
          supplierId: ssSupplier ? ssSupplier.id : "",
          category: "",
          brand: product.brandName,
          style: product.styleName,
          color: product.colorName,
          size: product.sizeName || "",
        });
        setSelectedProductImage(product.colorFrontImage || "");
        toast({
          title: "Product Found",
          description: `Found ${product.brandName} ${product.styleName} in S&S Activewear catalog`,
        });
      } else {
        toast({
          title: "Search Results",
          description: `Found ${products.length} products matching your search`,
        });
      }
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

      setSearchError(error.message);
      toast({
        title: "Product Not Found",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onOpenChange(false);
      resetForm();
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
        description: "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/products/${product?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onOpenChange(false);
      resetForm();
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
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchError("Please enter a search query");
      return;
    }

    setIsSearching(true);
    searchProductMutation.mutate(searchQuery.trim(), {
      onSettled: () => setIsSearching(false),
    });
  };

  const selectProduct = (product: SsActivewearProduct) => {
    // Try to find S&S Activewear in the suppliers list to auto-select
    const ssSupplier = suppliers.find(s => s.name.toLowerCase().includes("s&s activewear") || s.name.toLowerCase().includes("ss activewear"));

    setFormData({
      sku: product.sku,
      name: `${product.brandName} ${product.styleName} - ${product.colorName}`,
      description: `${product.brandName} ${product.styleName} in ${product.colorName}, Size: ${product.sizeName}`,
      price: product.piecePrice?.toString() || "",
      supplierId: ssSupplier ? ssSupplier.id : "",
      category: "",
      brand: product.brandName,
      style: product.styleName,
      color: product.colorName,
      size: product.sizeName || "",
    });
    setSelectedProductImage(product.colorFrontImage || "");
    setSearchResults([]);
    setSearchQuery("");
    toast({
      title: "Product Selected",
      description: `Selected ${product.brandName} ${product.styleName}`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if any suppliers exist, if not, we might need to handle it
    const finalSupplierId = formData.supplierId || (suppliers.length > 0 ? suppliers[0].id : null);

    if (!formData.name || !formData.sku || !finalSupplierId) {
      toast({
        title: "Missing Information",
        description: "Please search for a product first or enter details manually. Make sure a name, SKU, and supplier are provided.",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      sku: formData.sku,
      name: formData.name,
      description: formData.description,
      basePrice: (parseFloat(formData.price) || 0).toString(),
      supplierId: finalSupplierId,
    };

    if (product) {
      updateProductMutation.mutate(productData);
    } else {
      createProductMutation.mutate(productData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product
              ? 'Update product information below.'
              : 'Enter a product number/SKU to automatically fetch details from S&S Activewear, or add product information manually.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Search Section - Only show when creating new product */}
          {!product && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                S&S Activewear Product Lookup
              </h3>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="searchQuery">Product Search</Label>
                    <Input
                      id="searchQuery"
                      placeholder="Enter SKU, style code, or product name (e.g., 3001, B00760033, Gildan)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="whitespace-nowrap"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Universal search across SKU numbers, style codes, and product names. Try "3001" or "Gildan".
                </p>
              </div>

              {searchError && (
                <p className="text-sm text-red-600 dark:text-red-400">{searchError}</p>
              )}

              {/* Search Results */}
              {searchResults.length > 1 && (
                <div className="space-y-2">
                  <Label>Search Results ({searchResults.length} found)</Label>
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {searchResults.map((product) => (
                      <div
                        key={product.sku}
                        className="flex items-center gap-3 p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => selectProduct(product)}
                      >
                        {product.colorFrontImage && (
                          <img
                            src={product.colorFrontImage}
                            alt={`${product.brandName} ${product.styleName}`}
                            className="w-12 h-12 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {product.brandName} {product.styleName} - {product.colorName}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {product.sku} | Size: {product.sizeName} | ${product.piecePrice}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected Product Image */}
          {selectedProductImage && (
            <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-center">
                <img
                  src={selectedProductImage}
                  alt="Selected Product"
                  className="w-32 h-32 object-cover rounded-lg border shadow-md mx-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    setSelectedProductImage("");
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">Product Image</p>
              </div>
            </div>
          )}

          {/* Product Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Product name"
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Product SKU"
              />
            </div>

            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Brand name"
              />
            </div>

            <div>
              <Label htmlFor="style">Style</Label>
              <Input
                id="style"
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                placeholder="Style number"
              />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Color"
              />
            </div>

            <div>
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="Size"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Product category"
              />
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={formData.supplierId}
                onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
            >
              {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {product ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                product ? 'Update Product' : 'Add Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}