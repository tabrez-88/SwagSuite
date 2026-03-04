import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageSquare, Package, X } from "lucide-react";
import { useLocation } from "wouter";
import type { OrderItemLine } from "@shared/schema";
import type { useProjectData } from "../hooks/useProjectData";

interface PresentationPreviewPageProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}

export default function PresentationPreviewPage({ orderId, data }: PresentationPreviewPageProps) {
  const [, setLocation] = useLocation();
  const { order, orderItems, companyName, companyData, allProducts, allItemLines } = data;
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const enrichedItems = useMemo(() => {
    return orderItems.map((item: any) => {
      const product = allProducts.find((p: any) => p.id === item.productId);
      const lines = allItemLines?.[item.id] || [];
      return {
        ...item,
        imageUrl: item.productImageUrl || product?.imageUrl || null,
        colors: item.productColors || product?.colors || [],
        sizes: item.productSizes || product?.sizes || [],
        brand: item.productBrand || product?.brand || null,
        description: item.productDescription || product?.description || null,
        lines,
      };
    });
  }, [orderItems, allProducts, allItemLines]);

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Back bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation(`/project/${orderId}/presentation/build`)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Editor
        </Button>
        <span className="text-sm text-gray-400">Preview Mode</span>
      </div>

      {/* Presentation Header Banner */}
      <div className="bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center gap-4">
          {/* Company logo placeholder */}
          <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-gray-800 font-bold text-lg">
              {companyName?.charAt(0) || "?"}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold">{companyName}</h1>
            <p className="text-gray-300 text-sm">
              PRESENTATION #{order.orderNumber} for {companyName}
            </p>
            {(order as any)?.notes && (
              <p className="text-gray-400 text-sm mt-0.5">{(order as any).notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {enrichedItems.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-600">No products in this presentation</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrichedItems.map((item: any) => (
              <div
                key={item.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setSelectedProduct(item)}
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName || "Product"}
                      className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-20 h-20 text-gray-200" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <p className="font-medium text-gray-900">{item.productName || "Unnamed Product"}</p>
                  {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}

                  {/* Color swatches */}
                  {item.colors && item.colors.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {item.colors.slice(0, 10).map((color: string, idx: number) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                          style={{ backgroundColor: color.toLowerCase() }}
                          title={color}
                        />
                      ))}
                      {item.colors.length > 10 && (
                        <span className="text-xs text-gray-400 self-center">+{item.colors.length - 10}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Lightbox */}
      {selectedProduct && (
        <ProductDetailLightbox
          item={selectedProduct}
          items={enrichedItems}
          companyName={companyName}
          onClose={() => setSelectedProduct(null)}
          onNavigate={setSelectedProduct}
        />
      )}
    </div>
  );
}

// ── Product Detail Lightbox (Client-Facing) ─────────────────────
function ProductDetailLightbox({ item, items, companyName, onClose, onNavigate }: {
  item: any;
  items: any[];
  companyName: string;
  onClose: () => void;
  onNavigate: (item: any) => void;
}) {
  const lines: OrderItemLine[] = item.lines || [];
  const currentIndex = items.findIndex((i: any) => i.id === item.id);

  const goNext = () => {
    if (currentIndex < items.length - 1) onNavigate(items[currentIndex + 1]);
  };
  const goPrev = () => {
    if (currentIndex > 0) onNavigate(items[currentIndex - 1]);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0">
        {/* Header Banner */}
        <div className="bg-gray-800 text-white px-6 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-sm">{companyName?.charAt(0) || "?"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{companyName}</h3>
            <p className="text-gray-300 text-xs truncate">Product Detail</p>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Thumbnail strip */}
        <div className="bg-gray-100 px-6 py-3 flex gap-2 overflow-x-auto">
          {items.map((p: any) => (
            <div
              key={p.id}
              className={`w-14 h-14 flex-shrink-0 bg-white rounded-md overflow-hidden border-2 cursor-pointer transition-all ${
                p.id === item.id ? "border-blue-500 shadow-md" : "border-transparent hover:border-gray-300"
              }`}
              onClick={() => onNavigate(p)}
            >
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="w-full h-full object-contain p-0.5" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-y-auto" style={{ maxHeight: "calc(95vh - 140px)" }}>
          {/* Left - Image with nav */}
          <div className="relative bg-gray-50 flex items-center justify-center p-8">
            {/* Nav arrows */}
            {currentIndex > 0 && (
              <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow hover:bg-white flex items-center justify-center text-teal-600">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {currentIndex < items.length - 1 && (
              <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow hover:bg-white flex items-center justify-center text-teal-600">
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div className="w-full aspect-square flex items-center justify-center">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName || ""} className="max-w-full max-h-full object-contain" />
              ) : (
                <Package className="w-32 h-32 text-gray-200" />
              )}
            </div>
          </div>

          {/* Right - Details */}
          <div className="p-6 space-y-5 overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold">{item.productName}</h2>
              {item.productSku && <p className="text-sm text-gray-400 mt-0.5">SKU: {item.productSku}</p>}
              {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            )}

            {/* Pricing */}
            <div>
              <h4 className="font-semibold text-sm border-b pb-1 mb-2">Pricing</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-1.5 text-xs font-semibold text-gray-500">Qty</th>
                      <th className="text-right px-3 py-1.5 text-xs font-semibold text-gray-500">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length > 0 ? (
                      lines.map((line: OrderItemLine) => (
                        <tr key={line.id} className="border-t">
                          <td className="px-3 py-1.5">{line.quantity}</td>
                          <td className="px-3 py-1.5 text-right font-medium">${Number(line.unitPrice || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t">
                        <td className="px-3 py-1.5">{item.quantity}</td>
                        <td className="px-3 py-1.5 text-right font-medium">${Number(item.unitPrice || 0).toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Colors */}
            {item.colors && item.colors.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm border-b pb-1 mb-2">Colors</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.colors.join(" · ")}
                </p>
              </div>
            )}

            {/* Sizes */}
            {item.sizes && item.sizes.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm border-b pb-1 mb-2">Sizes</h4>
                <p className="text-sm text-gray-600 uppercase">
                  {item.sizes.join(" · ")}
                </p>
              </div>
            )}

            {/* Comment Button */}
            <Button variant="secondary" className="w-full gap-2 bg-gray-300 hover:bg-gray-400 text-gray-700">
              <MessageSquare className="w-4 h-4" />
              Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
