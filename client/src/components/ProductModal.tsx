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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Loader2, Search, ShoppingCart, Database, Pencil, CheckCircle2, Package } from "lucide-react";
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

interface SageProduct {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price?: number;
  imageUrl?: string;
  brand?: string;
  category?: string;
}

export default function ProductModal({ open, onOpenChange, product }: ProductModalProps) {
  const [activeTab, setActiveTab] = useState("manual");
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
  const [sageSearchQuery, setSageSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SsActivewearProduct[]>([]);
  const [sageSearchResults, setSageSearchResults] = useState<SageProduct[]>([]);
  const [selectedProductImage, setSelectedProductImage] = useState<string>("");
  const [dataSource, setDataSource] = useState<"manual" | "ss-activewear" | "sage">("manual");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: open,
  });

  // Populate form when editing existing product
  useEffect(() => {
    if (product && open) {
      // Helper to parse colors/sizes from database (might be string or array)
      const parseToString = (field: any): string => {
        if (!field) return '';
        
        // If already array, join it
        if (Array.isArray(field)) {
          return field.join(', ');
        }
        
        // If string, try to parse as JSON first
        if (typeof field === 'string') {
          try {
            const parsed = JSON.parse(field);
            if (Array.isArray(parsed)) {
              return parsed.join(', ');
            }
          } catch {
            // If not valid JSON, return as is
          }
          return field;
        }
        
        return '';
      };

      const colorsString = parseToString(product.colors);
      const sizesString = parseToString(product.sizes);

      setFormData({
        sku: product.sku || "",
        name: product.name || "",
        description: product.description || "",
        price: product.basePrice?.toString() || "",
        supplierId: product.supplierId || "",
        category: "",
        brand: "",
        style: "",
        color: colorsString,
        size: sizesString,
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
    setSageSearchQuery("");
    setSearchResults([]);
    setSageSearchResults([]);
    setSearchError("");
    setDataSource("manual");
    setActiveTab("manual");
  };

  const searchProductMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/ss-activewear/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No products found in S&S Activewear catalog");
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || "Failed to search products");
      }

      return response.json() as Promise<SsActivewearProduct[]>;
    },
    onSuccess: (products) => {
      setSearchResults(products);
      setSearchError("");

      if (products.length === 0) {
        toast({
          title: "No Results",
          description: "No products found matching your search",
          variant: "destructive",
        });
        return;
      }

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
        setDataSource("ss-activewear");
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

  const searchSageProductMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/sage/products?search=${encodeURIComponent(query)}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No products found in SAGE catalog");
        }
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || "Failed to search SAGE products");
      }

      const products = await response.json();
      
      // Transform SAGE products to match expected interface
      return products.map((p: any) => ({
        id: p.productId || p.spc || p.SPC || p.id,
        name: p.productName || p.name,
        description: p.description,
        sku: p.productNumber || p.sku || p.productId,
        price: p.pricingStructure?.minPrice ? parseFloat(p.pricingStructure.minPrice) : undefined,
        imageUrl: p.imageGallery?.[0] || p.thumbPic,
        brand: p.supplierName || p.brand,
        category: p.category,
      })) as SageProduct[];
    },
    onSuccess: (products) => {
      setSageSearchResults(products);
      setSearchError("");

      if (products.length === 0) {
        toast({
          title: "No Results",
          description: "No products found in SAGE catalog",
          variant: "destructive",
        });
        return;
      }

      if (products.length === 1) {
        const product = products[0];
        const sageSupplier = suppliers.find(s => s.name.toLowerCase().includes("sage"));

        setFormData({
          sku: product.sku,
          name: product.name,
          description: product.description || "",
          price: product.price?.toString() || "",
          supplierId: sageSupplier ? sageSupplier.id : "",
          category: product.category || "",
          brand: product.brand || "",
          style: "",
          color: "",
          size: "",
        });
        setSelectedProductImage(product.imageUrl || "");
        setDataSource("sage");
        toast({
          title: "Product Found",
          description: `Found ${product.name} in SAGE catalog`,
        });
      } else {
        toast({
          title: "Search Results",
          description: `Found ${products.length} products in SAGE`,
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
      // Invalidate all product-related queries (including vendor products)
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

  const handleSageSearch = () => {
    if (!sageSearchQuery.trim()) {
      setSearchError("Please enter a search query");
      return;
    }

    setIsSearching(true);
    searchSageProductMutation.mutate(sageSearchQuery.trim(), {
      onSettled: () => setIsSearching(false),
    });
  };

  const selectProduct = (product: SsActivewearProduct) => {
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
    setDataSource("ss-activewear");
    setActiveTab("manual");
    toast({
      title: "Product Imported",
      description: `Imported ${product.brandName} ${product.styleName} from S&S Activewear`,
    });
  };

  const selectSageProduct = (product: SageProduct) => {
    const sageSupplier = suppliers.find(s => s.name.toLowerCase().includes("sage"));

    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      price: product.price?.toString() || "",
      supplierId: sageSupplier ? sageSupplier.id : "",
      category: product.category || "",
      brand: product.brand || "",
      style: "",
      color: "",
      size: "",
    });
    setSelectedProductImage(product.imageUrl || "");
    setSageSearchResults([]);
    setSageSearchQuery("");
    setDataSource("sage");
    setActiveTab("manual");
    toast({
      title: "Product Imported",
      description: `Imported ${product.name} from SAGE`,
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

    // Build colors and sizes arrays from comma-separated strings
    const colorsArray = formData.color ? formData.color.split(',').map(c => c.trim()).filter(c => c) : [];
    const sizesArray = formData.size ? formData.size.split(',').map(s => s.trim()).filter(s => s) : [];

    const productData = {
      sku: formData.sku,
      name: formData.name,
      description: formData.description,
      basePrice: (parseFloat(formData.price) || 0).toString(),
      supplierId: finalSupplierId,
      colors: colorsArray.length > 0 ? colorsArray : null,
      sizes: sizesArray.length > 0 ? sizesArray : null,
      imageUrl: selectedProductImage || undefined,
    };

    if (product) {
      updateProductMutation.mutate(productData);
    } else {
      createProductMutation.mutate(productData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product ? (
              <>
                <Pencil className="h-5 w-5" />
                Edit Product
              </>
            ) : (
              <>
                <Package className="h-5 w-5" />
                Add New Product
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {product
              ? 'Update product information below.'
              : 'Search from S&S Activewear or SAGE catalogs, or enter details manually.'
            }
          </DialogDescription>
        </DialogHeader>

        {!product && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="ss-activewear" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                S&S Activewear
              </TabsTrigger>
              <TabsTrigger value="sage" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                SAGE
              </TabsTrigger>
            </TabsList>

            {/* S&S Activewear Search Tab */}
            <TabsContent value="ss-activewear" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                      Search S&S Activewear Catalog
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Enter SKU, style code, or product name to search the S&S Activewear catalog.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter SKU, style code, or product name (e.g., 3001, Gildan)"
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
                    <Button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
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

                  {searchError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{searchError}</p>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Search Results</Label>
                        <Badge variant="secondary">{searchResults.length} found</Badge>
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {searchResults.map((product) => (
                          <Card
                            key={product.sku}
                            className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => selectProduct(product)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {product.colorFrontImage && (
                                  <img
                                    src={product.colorFrontImage}
                                    alt={`${product.brandName} ${product.styleName}`}
                                    className="w-20 h-20 object-cover rounded border"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm truncate">
                                    {product.brandName} {product.styleName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {product.colorName} • Size: {product.sizeName}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      SKU: {product.sku}
                                    </Badge>
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                      ${product.piecePrice}
                                    </Badge>
                                  </div>
                                </div>
                                <Button size="sm" variant="default">
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Import
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SAGE Search Tab */}
            <TabsContent value="sage" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Database className="h-5 w-5 text-purple-600" />
                      Search SAGE Catalog
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Enter product name or SKU to search the SAGE catalog.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter product name or SKU"
                        value={sageSearchQuery}
                        onChange={(e) => setSageSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSageSearch();
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleSageSearch}
                      disabled={isSearching || !sageSearchQuery.trim()}
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

                  {searchError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{searchError}</p>
                    </div>
                  )}

                  {sageSearchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Search Results</Label>
                        <Badge variant="secondary">{sageSearchResults.length} found</Badge>
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {sageSearchResults.map((product) => (
                          <Card
                            key={product.id}
                            className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => selectSageProduct(product)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {product.imageUrl && (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-20 h-20 object-cover rounded border"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm truncate">
                                    {product.name}
                                  </div>
                                  {product.description && (
                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                      {product.description}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      SKU: {product.sku}
                                    </Badge>
                                    {product.price && (
                                      <Badge className="bg-green-100 text-green-800 text-xs">
                                        ${product.price}
                                      </Badge>
                                    )}
                                    {product.brand && (
                                      <Badge variant="secondary" className="text-xs">
                                        {product.brand}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button size="sm" variant="default">
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Import
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              {/* Form content will be here */}
            </TabsContent>
          </Tabs>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Source Indicator */}
          {dataSource !== "manual" && !product && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              {dataSource === "ss-activewear" ? (
                <>
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Imported from S&S Activewear</p>
                    <p className="text-xs text-blue-700">Review and modify the details below before saving.</p>
                  </div>
                </>
              ) : (
                <>
                  <Database className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Imported from SAGE</p>
                    <p className="text-xs text-purple-700">Review and modify the details below before saving.</p>
                  </div>
                </>
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
              <Label htmlFor="color">Colors</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g. Red, Blue, Green (comma-separated)"
              />
              <p className="text-xs text-muted-foreground mt-1">Separate multiple colors with commas</p>
            </div>

            <div>
              <Label htmlFor="size">Sizes</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g. S, M, L, XL (comma-separated)"
              />
              <p className="text-xs text-muted-foreground mt-1">Separate multiple sizes with commas</p>
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