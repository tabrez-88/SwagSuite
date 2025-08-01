import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Loader2, Search } from "lucide-react";

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function ProductModal({ open, onOpenChange }: ProductModalProps) {
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    price: "",
    supplier: "S&S Activewear",
    category: "",
    brand: "",
    style: "",
    color: "",
    size: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchProductMutation = useMutation({
    mutationFn: async (sku: string) => {
      const response = await fetch(`/api/ss-activewear/product/${sku}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Product not found in S&S Activewear catalog");
        }
        throw new Error("Failed to fetch product details");
      }
      
      return response.json() as Promise<SsActivewearProduct>;
    },
    onSuccess: (product) => {
      setFormData({
        sku: product.sku,
        name: `${product.brandName} ${product.styleName} - ${product.colorName}`,
        description: `${product.brandName} ${product.styleName} in ${product.colorName}, Size: ${product.sizeName}`,
        price: product.piecePrice?.toString() || "",
        supplier: "S&S Activewear",
        category: "",
        brand: product.brandName,
        style: product.styleName,
        color: product.colorName,
        size: product.sizeName || "",
      });
      setSearchError("");
      toast({
        title: "Product Found",
        description: `Found ${product.brandName} ${product.styleName} in S&S Activewear catalog`,
      });
    },
    onError: (error: Error) => {
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

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      description: "",
      price: "",
      supplier: "S&S Activewear",
      category: "",
      brand: "",
      style: "",
      color: "",
      size: "",
    });
    setSearchError("");
  };

  const handleSearch = () => {
    if (!formData.sku.trim()) {
      setSearchError("Please enter a product number/SKU");
      return;
    }
    
    setIsSearching(true);
    searchProductMutation.mutate(formData.sku.trim(), {
      onSettled: () => setIsSearching(false),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sku) {
      toast({
        title: "Missing Information",
        description: "Please search for a product first or enter product details manually",
        variant: "destructive",
      });
      return;
    }

    createProductMutation.mutate({
      sku: formData.sku,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      supplierId: "s-s-activewear", // Default supplier ID for S&S Activewear
      category: formData.category,
      brand: formData.brand,
      style: formData.style,
      color: formData.color,
      size: formData.size,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter a product number/SKU to automatically fetch details from S&S Activewear, or add product information manually.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Search Section */}
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              S&S Activewear Product Lookup
            </h3>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="sku">Product Number / SKU</Label>
                <Input
                  id="sku"
                  placeholder="Enter product SKU (e.g., B00760033)"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || !formData.sku.trim()}
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
            
            {searchError && (
              <p className="text-sm text-red-600 dark:text-red-400">{searchError}</p>
            )}
          </div>

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
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Supplier name"
              />
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
              disabled={createProductMutation.isPending}
            >
              {createProductMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}