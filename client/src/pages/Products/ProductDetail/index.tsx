import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ProductModal from "@/components/modals/ProductModal";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";
import TierPricingPanel from "@/components/sections/TierPricingPanel";
import {
  ArrowLeft,
  Box,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  ExternalLink,
  Package,
  Palette,
  Ruler,
  ShoppingCart,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { updateProduct } from "@/services/products/requests";
import { useProductDetail } from "./hooks";

export default function ProductDetailPage() {
  const {
    product,
    supplierName,
    ordersWithProduct,
    isLoading,
    isEditOpen,
    setIsEditOpen,
    pricingTiers,
    marginSettings,
    handleBack,
    handleNavigateToOrder,
    handleDelete,
    handleSaveTiers,
    parseArrayField,
  } = useProductDetail();

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Package className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500">Product not found</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
        </Button>
      </div>
    );
  }

  const colors = parseArrayField(product.colors);
  const sizes = parseArrayField(product.sizes);
  const imprintMethods = parseArrayField(product.imprintMethods);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3">
        {/* Back + Actions row */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={() => setIsEditOpen(true)}>
              <Edit className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Edit Product</span>
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Product image + info */}
        <div className="flex gap-3 sm:gap-4">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-16 h-16 sm:w-24 sm:h-24 object-contain rounded-lg border bg-white flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setImagePreviewOpen(true)}
            />
          ) : (
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg border bg-gray-50 flex items-center justify-center flex-shrink-0">
              <Box className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{product.name}</h1>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
              {product.sku && <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">{product.sku}</Badge>}
              {supplierName && (
                <Badge variant="secondary" className="gap-1 text-[10px] sm:text-xs">
                  <Building2 className="w-3 h-3" /> {supplierName}
                </Badge>
              )}
              {product.category && <Badge variant="outline" className="text-[10px] sm:text-xs">{product.category}</Badge>}
              {product.productType && <Badge variant="outline" className="capitalize text-[10px] sm:text-xs">{product.productType}</Badge>}
            </div>
            {product.description && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2 sm:line-clamp-3">{product.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Product Info Card — all details in one card */}
          <Card>
            <CardContent className="p-3 sm:p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {product.basePrice && (
                  <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-[10px] text-gray-500 uppercase font-medium">Base Price</span>
                    </div>
                    <p className="font-bold text-base sm:text-lg text-green-700">${Number(product.basePrice).toFixed(2)}</p>
                  </div>
                )}
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] text-gray-500 uppercase font-medium">Min Qty</span>
                  </div>
                  <p className="font-bold text-base sm:text-lg text-blue-700">{product.minimumQuantity || 1}</p>
                </div>
                {product.leadTime && (
                  <div className="p-2 sm:p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-orange-600" />
                      <span className="text-[10px] text-gray-500 uppercase font-medium">Lead Time</span>
                    </div>
                    <p className="font-bold text-base sm:text-lg text-orange-700">{product.leadTime}d</p>
                  </div>
                )}
                <div className="p-2 sm:p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShoppingCart className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-[10px] text-gray-500 uppercase font-medium">Orders</span>
                  </div>
                  <p className="font-bold text-base sm:text-lg text-purple-700">{ordersWithProduct.length}</p>
                </div>
              </div>

              {/* Additional details row */}
              <div className="mt-3 sm:mt-4 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {product.sku && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">SKU</span>
                    <span className="font-mono font-medium">{product.sku}</span>
                  </div>
                )}
                {product.supplierSku && product.supplierSku !== product.sku && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier SKU</span>
                    <span className="font-mono font-medium">{product.supplierSku}</span>
                  </div>
                )}
                {product.brand && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Brand</span>
                    <span className="font-medium">{product.brand}</span>
                  </div>
                )}
                {product.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Added</span>
                    <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
                {product.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updated</span>
                    <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">ID</span>
                  <span className="font-mono text-[10px] text-gray-400 truncate">{product.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Pricing Tiers — editable, no Apply buttons in catalog context */}
          <TierPricingPanel
            tiers={pricingTiers}
            defaultMargin={parseFloat(String(marginSettings?.defaultMargin || "40"))}
            editable
            onTiersChange={handleSaveTiers}
            sizeSurcharges={(product as any).sizeSurcharges || []}
            availableSizes={sizes}
            onSizeSurchargesChange={(surcharges) => {
              updateProduct(product.id, { sizeSurcharges: surcharges });
            }}
          />

          {/* Colors & Sizes */}
          {(colors.length > 0 || sizes.length > 0) && (
            <Card>
              <CardContent className="p-3 sm:p-5 space-y-4">
                {colors.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">Colors ({colors.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {colors.map((color, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{color}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {colors.length > 0 && sizes.length > 0 && <Separator />}
                {sizes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Ruler className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">Sizes ({sizes.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sizes.map((size, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{size}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Imprint Methods */}
          {imprintMethods.length > 0 && (
            <Card>
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">Imprint Methods ({imprintMethods.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {imprintMethods.map((method, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{method}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Orders */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Used In Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersWithProduct.length > 0 ? (
                <div className="space-y-2">
                  {ordersWithProduct.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => handleNavigateToOrder(order.id)}
                    >
                      <div>
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.companyName}</p>
                        {order.quantity && (
                          <p className="text-xs text-gray-400">{order.quantity} pcs @ ${Number(order.unitPrice || 0).toFixed(2)}</p>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">No orders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Product Modal */}
      <ProductModal
        open={isEditOpen}
        onOpenChange={(open) => { if (!open) setIsEditOpen(false); }}
        product={product}
      />

      {/* Image Preview Modal */}
      {product.imageUrl && (
        <FilePreviewModal
          open={imagePreviewOpen}
          onClose={() => setImagePreviewOpen(false)}
          file={{
            originalName: product.name,
            fileName: product.name,
            filePath: product.imageUrl,
            mimeType: "image/jpeg",
          }}
        />
      )}
    </div>
  );
}
