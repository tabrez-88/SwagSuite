import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Package,
  Send,
  X,
} from "lucide-react";
import { usePublicPresentation } from "./hooks";
import { fontFamilyMap } from "./types";
import type { PresentationData } from "./types";

export default function PublicPresentationPage() {
  const {
    data,
    isLoading,
    error,
    selectedProduct,
    setSelectedProduct,
    postCommentMutation,
    invalidatePresentation,
  } = usePublicPresentation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading presentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-medium text-gray-700 mb-2">
            {(error as Error).message?.includes("expired") ? "This presentation has expired" : "Presentation not found"}
          </h2>
          <p className="text-gray-500">Please contact your sales representative for an updated link.</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { presentation, items, comments } = data;
  const font = fontFamilyMap[presentation.fontFamily] || fontFamilyMap.default;

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: font }}>
      {/* Header Banner */}
      <div style={{ backgroundColor: presentation.primaryColor }} className="text-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {presentation.headerStyle === "centered" ? (
            <div className="text-center">
              {presentation.logoUrl ? (
                <img src={presentation.logoUrl} alt="" className="w-16 h-16 mx-auto mb-3 object-contain rounded-lg bg-white/20 p-1" />
              ) : (
                <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold">{presentation.companyName?.charAt(0)}</span>
                </div>
              )}
              <h1 className="text-2xl font-bold">{presentation.companyName}</h1>
              <p className="text-white/80 text-sm mt-1">PRESENTATION #{presentation.orderNumber}</p>
            </div>
          ) : presentation.headerStyle === "minimal" ? (
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold">{presentation.companyName}</h1>
              <span className="text-white/60 text-sm">#{presentation.orderNumber}</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {presentation.logoUrl ? (
                <img src={presentation.logoUrl} alt="" className="w-14 h-14 object-contain rounded-lg bg-white/20 p-1" />
              ) : (
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold">{presentation.companyName?.charAt(0)}</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{presentation.companyName}</h1>
                <p className="text-white/80 text-sm">PRESENTATION #{presentation.orderNumber}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Introduction */}
      {presentation.introduction && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-white rounded-lg p-4 text-sm text-gray-600 leading-relaxed">
            {presentation.introduction}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-600">No products in this presentation</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any) => {
              const itemComments = comments[item.id] || [];
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelectedProduct(item)}
                >
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {item.productImageUrl ? (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName || "Product"}
                        className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-20 h-20 text-gray-200" />
                      </div>
                    )}
                    {itemComments.length > 0 && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {itemComments.length}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-gray-900">{item.productName || "Product"}</p>
                    {item.productBrand && <p className="text-sm text-gray-500">{item.productBrand}</p>}
                    {!presentation.hidePricing && item.unitPrice && (
                      <p className="text-sm font-semibold mt-1" style={{ color: presentation.primaryColor }}>
                        {item.lines?.length > 0
                          ? `$${Math.min(...item.lines.map((l: any) => Number(l.unitPrice))).toFixed(2)} - $${Math.max(...item.lines.map((l: any) => Number(l.unitPrice))).toFixed(2)}`
                          : `$${Number(item.unitPrice).toFixed(2)}`
                        }
                      </p>
                    )}
                    {item.productColors && item.productColors.length > 0 && (
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {item.productColors.slice(0, 8).map((color: string, idx: number) => (
                          <div
                            key={idx}
                            className="w-5 h-5 rounded-full border border-gray-200 shadow-sm"
                            style={{ backgroundColor: color.toLowerCase() }}
                            title={color}
                          />
                        ))}
                        {item.productColors.length > 8 && (
                          <span className="text-xs text-gray-400 self-center">+{item.productColors.length - 8}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {presentation.footerText && (
        <div className="border-t bg-white">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <p className="text-sm text-gray-500 text-center">{presentation.footerText}</p>
          </div>
        </div>
      )}

      {/* Product Detail Lightbox */}
      {selectedProduct && (
        <ProductLightbox
          item={selectedProduct}
          items={items}
          presentation={presentation}
          comments={comments}
          postCommentMutation={postCommentMutation}
          onClose={() => setSelectedProduct(null)}
          onNavigate={setSelectedProduct}
        />
      )}
    </div>
  );
}

function ProductLightbox({
  item, items, presentation, comments, postCommentMutation, onClose, onNavigate,
}: {
  item: any;
  items: any[];
  presentation: PresentationData["presentation"];
  comments: Record<string, any[]>;
  postCommentMutation: { mutate: (vars: { orderItemId: number; content: string; clientName: string }) => void; isPending: boolean };
  onClose: () => void;
  onNavigate: (item: any) => void;
}) {
  const currentIndex = items.findIndex((i: any) => i.id === item.id);
  const itemComments = comments[item.id] || [];
  const [showComments, setShowComments] = useState(false);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");

  const goNext = () => { if (currentIndex < items.length - 1) onNavigate(items[currentIndex + 1]); };
  const goPrev = () => { if (currentIndex > 0) onNavigate(items[currentIndex - 1]); };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 flex flex-col [&>button.absolute]:hidden">
        {/* Header */}
        <div style={{ backgroundColor: presentation.primaryColor }} className="text-white px-6 py-3 flex items-center gap-3 flex-shrink-0">
          {presentation.logoUrl ? (
            <img src={presentation.logoUrl} alt="" className="w-10 h-10 object-contain rounded-lg bg-white/20 p-0.5" />
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-sm">{presentation.companyName?.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{presentation.companyName}</h3>
            <p className="text-white/70 text-xs truncate">Product Detail</p>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Thumbnail strip */}
        <div className="bg-gray-100 px-6 py-3 flex gap-2 overflow-x-auto flex-shrink-0">
          {items.map((p: any) => (
            <div
              key={p.id}
              className={`w-14 h-14 flex-shrink-0 bg-white rounded-md overflow-hidden border-2 cursor-pointer transition-all ${
                p.id === item.id ? "border-blue-500 shadow-md" : "border-transparent hover:border-gray-300"
              }`}
              onClick={() => onNavigate(p)}
            >
              {p.productImageUrl ? (
                <img src={p.productImageUrl} alt="" className="w-full h-full object-contain p-0.5" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-y-auto flex-1 min-h-0">
          {/* Left - Image */}
          <div className="relative bg-gray-50 flex items-center justify-center p-8">
            {currentIndex > 0 && (
              <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow hover:bg-white flex items-center justify-center" style={{ color: presentation.primaryColor }}>
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {currentIndex < items.length - 1 && (
              <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow hover:bg-white flex items-center justify-center" style={{ color: presentation.primaryColor }}>
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            <div className="w-full aspect-square flex items-center justify-center">
              {item.productImageUrl ? (
                <img src={item.productImageUrl} alt={item.productName || ""} className="max-w-full max-h-full object-contain" />
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
              {item.productBrand && <p className="text-sm text-gray-500">{item.productBrand}</p>}
            </div>

            {item.productDescription && (
              <p className="text-sm text-gray-600 leading-relaxed">{item.productDescription}</p>
            )}

            {/* Pricing */}
            {!presentation.hidePricing && (item.lines?.length > 0 || item.unitPrice) && (
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
                      {item.lines?.length > 0 ? (
                        item.lines.map((line: any) => (
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
            )}

            {/* Additional Charges */}
            {!presentation.hidePricing && item.charges?.length > 0 && (
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

            {/* Colors */}
            {item.productColors?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm border-b pb-1 mb-2">Colors</h4>
                <p className="text-sm text-gray-600">{item.productColors.join(" · ")}</p>
              </div>
            )}

            {/* Sizes */}
            {item.productSizes?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm border-b pb-1 mb-2">Sizes</h4>
                <p className="text-sm text-gray-600 uppercase">{item.productSizes.join(" · ")}</p>
              </div>
            )}

            {/* Comments Section */}
            <div className="pt-2 border-t">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 w-full py-2 text-sm font-medium"
                style={{ color: presentation.primaryColor }}
              >
                <MessageSquare className="w-4 h-4" />
                {itemComments.length > 0 ? `Comments (${itemComments.length})` : "Add a Comment"}
              </button>

              {showComments && (
                <div className="space-y-3 mt-2">
                  {/* Existing comments */}
                  {itemComments.map((c: any) => (
                    <div key={c.id} className={`p-3 rounded-lg text-sm ${c.isClient ? "bg-blue-50" : "bg-yellow-50"}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-xs">{c.isClient ? c.clientName || "Client" : "Sales Rep"}</span>
                        <span className="text-xs text-gray-400">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-gray-700">{c.content}</p>
                    </div>
                  ))}

                  {/* New comment form */}
                  <div className="space-y-2">
                    <Input
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="Your name"
                      className="h-8 text-sm"
                    />
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Comment on this product..."
                      className="min-h-[60px] resize-none text-sm"
                    />
                    <Button
                      size="sm"
                      className="w-full gap-1"
                      style={{ backgroundColor: presentation.primaryColor }}
                      onClick={() => {
                        postCommentMutation.mutate({
                          orderItemId: item.id,
                          content: commentText,
                          clientName: commentName || "Client",
                        });
                        setCommentText("");
                      }}
                      disabled={!commentText.trim() || postCommentMutation.isPending}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {postCommentMutation.isPending ? "Posting..." : "Add Comment"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
