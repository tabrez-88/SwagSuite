import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageSquare, Package, X } from "lucide-react";
import type { OrderItemLine } from "@shared/schema";
import type { PresentationPreviewPageProps, ProductDetailLightboxProps } from "./types";
import { usePresentationPreviewPage } from "./hooks";

export default function PresentationPreviewPage(props: PresentationPreviewPageProps) {
  const {
    order,
    companyName,
    enrichedItems,
    selectedProduct,
    setSelectedProduct,
    primaryColor,
    headerStyle,
    font,
    footerText,
    logoUrl,
    hidePricing,
    introduction,
    handleBackToEditor,
    handleCloseProduct,
  } = usePresentationPreviewPage(props);

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: font }}>
      {/* Back bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBackToEditor}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Editor
        </Button>
        <span className="text-sm text-gray-400">Preview Mode — This is how clients will see your presentation</span>
      </div>

      {/* Presentation Header Banner */}
      <div style={{ backgroundColor: primaryColor }} className="text-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {headerStyle === "centered" ? (
            <div className="text-center">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-16 h-16 mx-auto mb-3 object-contain rounded-lg bg-white/20 p-1" />
              ) : (
                <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold">{companyName?.charAt(0) || "?"}</span>
                </div>
              )}
              <h1 className="text-2xl font-bold">{companyName}</h1>
              <p className="text-white/80 text-sm mt-1">PRESENTATION #{order.orderNumber}</p>
            </div>
          ) : headerStyle === "minimal" ? (
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold">{companyName}</h1>
              <span className="text-white/60 text-sm">#{order.orderNumber}</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-14 h-14 object-contain rounded-lg bg-white/20 p-1" />
              ) : (
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold">{companyName?.charAt(0) || "?"}</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{companyName}</h1>
                <p className="text-white/80 text-sm">PRESENTATION #{order.orderNumber} for {companyName}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Introduction */}
      {introduction && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-white rounded-lg p-4 text-sm text-gray-600 leading-relaxed">{introduction}</div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {enrichedItems.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-600">No products in this presentation</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrichedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setSelectedProduct(item)}
              >
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName || "Product"} className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-20 h-20 text-gray-200" /></div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-medium text-gray-900">{item.productName || "Unnamed Product"}</p>
                  {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}
                  {!hidePricing && (
                    <p className="text-sm font-semibold mt-1" style={{ color: primaryColor }}>
                      ${Number(item.unitPrice || 0).toFixed(2)}
                    </p>
                  )}
                  {item.colors && item.colors.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {item.colors.slice(0, 10).map((color: string, idx: number) => (
                        <div key={idx} className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: color.toLowerCase() }} title={color} />
                      ))}
                      {item.colors.length > 10 && <span className="text-xs text-gray-400 self-center">+{item.colors.length - 10}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {footerText && (
        <div className="border-t bg-white">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <p className="text-sm text-gray-500 text-center">{footerText}</p>
          </div>
        </div>
      )}

      {/* Product Detail Lightbox */}
      {selectedProduct && (
        <ProductDetailLightbox
          item={selectedProduct}
          items={enrichedItems}
          companyName={companyName}
          primaryColor={primaryColor}
          logoUrl={logoUrl}
          hidePricing={hidePricing}
          onClose={handleCloseProduct}
          onNavigate={setSelectedProduct}
        />
      )}
    </div>
  );
}

function ProductDetailLightbox({ item, items, companyName, primaryColor, logoUrl, hidePricing, onClose, onNavigate }: ProductDetailLightboxProps) {
  const lines: OrderItemLine[] = item.lines || [];
  const currentIndex = items.findIndex((i) => i.id === item.id);

  const goNext = () => { if (currentIndex < items.length - 1) onNavigate(items[currentIndex + 1]); };
  const goPrev = () => { if (currentIndex > 0) onNavigate(items[currentIndex - 1]); };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 flex flex-col [&>button.absolute]:hidden">
        {/* Header */}
        <div style={{ backgroundColor: primaryColor }} className="text-white px-6 py-3 flex items-center gap-3 flex-shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-10 h-10 object-contain rounded-lg bg-white/20 p-0.5" />
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-sm">{companyName?.charAt(0) || "?"}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{companyName}</h3>
            <p className="text-white/70 text-xs truncate">Product Detail</p>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Thumbnail strip */}
        <div className="bg-gray-100 px-6 py-3 flex gap-2 overflow-x-auto flex-shrink-0">
          {items.map((p) => (
            <div
              key={p.id}
              className={`w-14 h-14 flex-shrink-0 bg-white rounded-md overflow-hidden border-2 cursor-pointer transition-all ${
                p.id === item.id ? "shadow-md" : "border-transparent hover:border-gray-300"
              }`}
              style={p.id === item.id ? { borderColor: primaryColor } : {}}
              onClick={() => onNavigate(p)}
            >
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="w-full h-full object-contain p-0.5" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-300" /></div>
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-y-auto flex-1 min-h-0">
          <div className="relative bg-gray-50 flex items-center justify-center p-8">
            {currentIndex > 0 && (
              <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow hover:bg-white flex items-center justify-center" style={{ color: primaryColor }}>
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {currentIndex < items.length - 1 && (
              <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow hover:bg-white flex items-center justify-center" style={{ color: primaryColor }}>
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

          <div className="p-6 space-y-5 overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold">{item.productName}</h2>
              {item.productSku && <p className="text-sm text-gray-400 mt-0.5">SKU: {item.productSku}</p>}
              {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}
            </div>

            {item.description && <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>}

            {!hidePricing && (
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
                      {lines.length > 0 ? lines.map((line: OrderItemLine) => (
                        <tr key={line.id} className="border-t">
                          <td className="px-3 py-1.5">{line.quantity}</td>
                          <td className="px-3 py-1.5 text-right font-medium">${Number(line.unitPrice || 0).toFixed(2)}</td>
                        </tr>
                      )) : (
                        <tr className="border-t">
                          <td className="px-3 py-1.5">{item.quantity}</td>
                          <td className="px-3 py-1.5 text-right font-medium">${Number(item.unitPrice || 0).toFixed(2)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!hidePricing && item.charges?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm border-b pb-1 mb-2">Additional Charges</h4>
                <div className="space-y-1.5">
                  {item.charges.map((charge: any) => (
                    <div key={charge.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{charge.description}</span>
                      <span className="font-medium">${Number(charge.amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.colors?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm border-b pb-1 mb-2">Colors</h4>
                <p className="text-sm text-gray-600">{item.colors.join(" · ")}</p>
              </div>
            )}

            {item.sizes?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm border-b pb-1 mb-2">Sizes</h4>
                <p className="text-sm text-gray-600 uppercase">{item.sizes.join(" · ")}</p>
              </div>
            )}

            <Button variant="secondary" className="w-full gap-2" style={{ backgroundColor: primaryColor + "20", color: primaryColor }}>
              <MessageSquare className="w-4 h-4" />
              Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
