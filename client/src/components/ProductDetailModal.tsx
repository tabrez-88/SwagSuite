import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  DollarSign, 
  Palette, 
  Ruler, 
  TrendingUp,
  ShoppingCart,
  Building2,
  Calendar,
  ExternalLink,
  Box,
  Edit,
  Trash2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    supplierSku?: string;
    supplierId?: string;
    categoryId?: string;
    basePrice?: number;
    minimumQuantity?: number;
    colors?: string[];
    sizes?: string[];
    imprintMethods?: string[];
    leadTime?: number;
    imageUrl?: string;
    productType?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  supplierName?: string;
  onEdit?: (product: any) => void;
  onDelete?: (productId: string) => void;
}

// Helper function to parse array fields that might be stored as strings or JSON
const parseArrayField = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field.filter(item => item && typeof item === 'string');
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && typeof item === 'string');
      }
      // If parsed is an object or other type, return empty
      return [];
    } catch {
      // If not valid JSON, treat as single value
      return field.trim() ? [field.trim()] : [];
    }
  }
  return [];
};

export function ProductDetailModal({ open, onOpenChange, product, supplierName, onEdit, onDelete }: ProductDetailModalProps) {
  const [, setLocation] = useLocation();

  // Fetch orders that include this product
  const { data: ordersWithProduct = [] } = useQuery<any[]>({
    queryKey: ["/api/products", product?.id, "orders"],
    enabled: !!product?.id && open,
    queryFn: async () => {
      // In a real implementation, this would fetch orders containing this product
      // For now, we'll return empty array
      return [];
    },
  });

  if (!product) return null;

  const handleCreateQuote = () => {
    setLocation(`/orders?product=${product.id}`);
    onOpenChange(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(product);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      onDelete(product.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center mt-5 justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Package className="w-6 h-6" />
              {product.name}
              {product.sku && (
                <Badge variant="outline" className="font-mono">
                  {product.sku}
                </Badge>
              )}
            </DialogTitle>
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SKU Information */}
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                {product.sku && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">SKU:</span>
                    <Badge variant="outline" className="font-mono">{product.sku}</Badge>
                  </div>
                )}
                {product.supplierSku && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Supplier SKU:</span>
                    <Badge variant="outline" className="font-mono">{product.supplierSku}</Badge>
                  </div>
                )}
                {product.productType && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Type:</span>
                    <Badge variant="secondary" className="capitalize">{product.productType}</Badge>
                  </div>
                )}
              </div>

              {product.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-700">{product.description}</p>
                </div>
              )}

              {supplierName && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Supplier:</span>
                  <Badge variant="outline">{supplierName}</Badge>
                </div>
              )}

              <Separator />

              {/* Pricing & Quantities */}
              <div className="space-y-3">
                {product.basePrice && (
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Base Price:</span>
                    </div>
                    <span className="text-lg font-bold text-green-700">
                      ${Number(product.basePrice).toFixed(2)}
                    </span>
                  </div>
                )}

                {product.minimumQuantity && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Min Quantity:</span>
                    </div>
                    <Badge>{product.minimumQuantity} pcs</Badge>
                  </div>
                )}

                {product.leadTime && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Lead Time:</span>
                    </div>
                    <Badge variant="outline">{product.leadTime} days</Badge>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              {(product.createdAt || product.updatedAt) && (
                <>
                  <Separator />
                  <div className="space-y-1 text-xs text-gray-500">
                    {product.createdAt && (
                      <p>Added: {new Date(product.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}</p>
                    )}
                    {product.updatedAt && (
                      <p>Last Updated: {new Date(product.updatedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    )}
                    <p className="font-mono text-[10px] text-gray-400 mt-2">ID: {product.id}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Product Image */}
          {product.imageUrl ? (
            <Card>
              <CardContent className="p-4">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-contain rounded-lg"
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit">
              <CardContent className="p-4 flex items-center justify-center h-64 bg-gray-50">
                <Box className="w-16 h-16 text-gray-300" />
              </CardContent>
            </Card>
          )}

          {/* Colors */}
          {(() => {
            const colors = parseArrayField(product.colors);
            return colors.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette className="w-5 h-5" />
                    Available Colors ({colors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color, index) => (
                      <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                        {color}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Sizes */}
          {(() => {
            const sizes = parseArrayField(product.sizes);
            return sizes.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Ruler className="w-5 h-5" />
                    Available Sizes ({sizes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size, index) => (
                      <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                        {size}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Imprint Methods */}
          {(() => {
            const imprintMethods = parseArrayField(product.imprintMethods);
            return imprintMethods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5" />
                    Imprint Methods ({imprintMethods.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {imprintMethods.map((method, index) => (
                      <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Orders Using This Product */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="w-5 h-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersWithProduct.length > 0 ? (
                <div className="space-y-2">
                  {ordersWithProduct.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                      <div>
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.companyName}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setLocation(`/orders?id=${order.id}`);
                          onOpenChange(false);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No orders yet using this product</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={handleCreateQuote}
                  >
                    Create First Quote
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <Button className="flex-1" onClick={handleCreateQuote}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Create Quote with This Product
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
