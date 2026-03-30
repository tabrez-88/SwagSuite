import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isBelowMinimum } from "@/hooks/useMarginSettings";
import { getCloudinaryThumbnail } from "@/lib/media-library";
import type { OrderAdditionalCharge, OrderItemLine } from "@shared/schema";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  DollarSign,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Image,
  Lock,
  Package,
  Palette,
  Percent,
  Ruler,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import type { useProductsSection } from "../hooks";

interface OrderItemCardProps {
  item: any;
  productSection: ReturnType<typeof useProductsSection>;
}

export default function OrderItemCard({ item, productSection }: OrderItemCardProps) {
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [currentLocation, setLocation] = useLocation();
  const isQuoteContext = currentLocation.includes("/quote");
  const editPath = isQuoteContext
    ? `/projects/${productSection.projectId}/quote/edit/${item.id}`
    : `/projects/${productSection.projectId}/sales-order/edit/${item.id}`;
  const isExpanded = productSection.expandedItems.has(item.id);
  const itemSupplier = productSection.getItemSupplier(item);
  const imageUrl = productSection.getProductImage(item);
  const artworkCount = productSection.getArtworkCount(item.id);
  const artworks = productSection.allArtworkItems[item.id] || [];
  const lines: OrderItemLine[] = productSection.allItemLines[item.id] || [];
  const charges: OrderAdditionalCharge[] = productSection.allItemCharges[item.id] || [];
  const totals = productSection.getItemTotals(item);

  return (
    <Card className="overflow-hidden">
      {/* Collapsed Summary Row */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => productSection.toggleExpand(item.id)}
      >
        <div className="flex gap-4 items-center">
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>

          <div className="flex-shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt={item.productName} className="w-16 h-16 object-cover rounded border" />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-blue-600 font-medium text-sm">
                    {item.productSku || "No SKU"}
                  </span>
                  {itemSupplier && (
                    <Badge variant="outline" className="text-[10px]">{itemSupplier.name}</Badge>
                  )}
                  {artworkCount > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Image className="w-3 h-3 mr-0.5" />
                      {artworkCount}
                    </Badge>
                  )}
                  {lines.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Ruler className="w-3 h-3 mr-0.5" />
                      {lines.length} line{lines.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 truncate text-sm">
                  {item.productName || "Unnamed Product"}
                </h3>
                {(item.description || item.productDescription) && (
                  <p className="text-[11px] text-gray-500 truncate text-wrap mt-0.5">{item.description || item.productDescription}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="justify-start"
                    disabled={productSection.isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(editPath);
                    }}
                  >
                    <Edit2 className="w-4 h-4 text-white" />
                    Edit
                  </Button>
                  {/* <Button
                    variant="outline"
                    size="sm"
                    disabled={productSection.isLocked || productSection.duplicateOrderItemMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCopyConfirm(true);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button> */}
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={productSection.isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      productSection.setDeletingProduct(item);
                      productSection.setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm flex-shrink-0 ml-4">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 uppercase">Qty</p>
                  <p className="font-semibold">{totals.totalQty}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 uppercase">Revenue</p>
                  <p className="font-semibold text-blue-600">${totals.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 uppercase">Margin</p>
                  <p className={`font-semibold ${productSection.marginColor(totals.margin)}`}>
                    {totals.margin.toFixed(1)}%
                    {isBelowMinimum(totals.margin, productSection.marginSettings) && (
                      <span title={`Below minimum margin (${productSection.marginSettings.minimumMargin}%)`}><AlertTriangle className="inline w-3 h-3 text-red-500 ml-0.5" /></span>
                    )}
                  </p>
                </div>

              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Expanded Details (read-only) */}
      {isExpanded && (
        <div className="border-t bg-gray-50/50">
          {/* LINE ITEMS TABLE */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-gray-400" />
                Pricing
              </h4>
            </div>

            {lines.length > 0 ? (
              <div className="border overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b text-xs">
                    <tr>
                      <th className="text-left p-2.5 font-bold">Color</th>
                      <th className="text-left p-2.5 font-bold">Size</th>
                      <th className="text-right p-2.5 font-bold w-20">Qty</th>
                      <th className="text-right p-2.5 font-bold w-24">Cost</th>
                      <th className="text-right p-2.5 font-bold w-24">Price</th>
                      <th className="text-right p-2.5 font-bold w-20">Margin</th>
                      <th className="text-right p-2.5 font-bold w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => {
                      const qty = line.quantity || 0;
                      const cost = parseFloat(line.cost || "0");
                      const price = parseFloat(line.unitPrice || "0");
                      const lineTotal = qty * price;
                      const m = price > 0 ? ((price - cost) / price) * 100 : 0;

                      return (
                        <tr key={line.id} className="border-b last:border-0">
                          <td className="p-2.5 text-xs">{line.color || "--"}</td>
                          <td className="p-2.5 text-xs">{line.size || "--"}</td>
                          <td className="p-2.5 text-right text-xs font-medium">{qty}</td>
                          <td className="p-2.5 text-right text-xs text-gray-500">${cost.toFixed(2)}</td>
                          <td className="p-2.5 text-right text-xs font-medium">${price.toFixed(2)}</td>
                          <td className="p-2.5 text-right">
                            <span className={`text-xs font-medium ${productSection.marginColor(m)}`}>{m.toFixed(1)}%</span>
                            {isBelowMinimum(m, productSection.marginSettings) && (
                              <span title={`Below minimum margin (${productSection.marginSettings.minimumMargin}%)`}><AlertTriangle className="inline w-3 h-3 text-red-500 ml-0.5" /></span>
                            )}
                          </td>
                          <td className="p-2.5 text-right text-xs font-medium">${lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-200 border-t text-xs">
                    <tr>
                      <td colSpan={2} className="p-2.5 font-semibold">Subtotal</td>
                      <td className="p-2.5 text-right font-semibold">{totals.totalQty}</td>
                      <td className="p-2.5 text-right text-gray-500">${totals.totalCost.toFixed(2)}</td>
                      <td className="p-2.5"></td>
                      <td className="p-2.5 text-right">
                        <span className={`font-semibold ${productSection.marginColor(totals.margin)}`}>{totals.margin.toFixed(1)}%</span>
                      </td>
                      <td className="p-2.5 text-right font-semibold">${totals.totalRevenue.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="border rounded-lg bg-white p-4 text-center text-sm text-gray-400">
                <p>No size/color breakdown — using item-level pricing</p>
                <div className="flex justify-center gap-6 mt-2 text-xs">
                  <span>Qty: <strong className="text-gray-700">{item.quantity}</strong></span>
                  <span>Cost: <strong className="text-gray-700">${(parseFloat(item.cost || "0")).toFixed(2)}</strong></span>
                  <span>Price: <strong className="text-gray-700">${(parseFloat(item.unitPrice || "0")).toFixed(2)}</strong></span>
                  <span>Total: <strong className="text-blue-600">${totals.totalRevenue.toFixed(2)}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* PRIVATE NOTES */}
          {item.privateNotes && (
            <div className="px-6 py-3 border-t">
              <div className="flex items-center gap-1.5 mb-1">
                <Lock className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">Private Notes</span>
                <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-600">team only</Badge>
              </div>
              <p className="text-xs text-gray-600 bg-amber-50/50 rounded px-2.5 py-1.5 border border-amber-100 whitespace-pre-wrap">{item.privateNotes}</p>
            </div>
          )}

          {/* CHARGES (Run + Fixed) */}
          {charges.length > 0 && (
            <div className="px-6 py-4 border-t">
              <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                Charges
              </h4>
              {(() => {
                const runCharges = charges.filter((c: any) => c.chargeCategory === "run");
                const fixedCharges = charges.filter((c: any) => c.chargeCategory !== "run");

                const renderCharge = (charge: any) => (
                  <div key={charge.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{charge.description}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {charge.chargeType === "percentage" ? <Percent className="w-2.5 h-2.5 mr-0.5" /> : <DollarSign className="w-2.5 h-2.5 mr-0.5" />}
                        {charge.chargeType}
                      </Badge>
                      {charge.isVendorCharge && (
                        <Badge variant="secondary" className="text-[10px]">vendor</Badge>
                      )}
                      {charge.includeInUnitPrice && (
                        <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600">
                          {charge.chargeCategory === "run" ? "included in price" : "absorbed in margin"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${charge.includeInUnitPrice ? "text-gray-400 line-through" : ""}`}>
                        ${parseFloat(charge.amount || "0").toFixed(2)}
                      </span>
                      {charge.displayToClient !== false
                        ? <Eye className="w-3 h-3 text-blue-400" />
                        : <EyeOff className="w-3 h-3 text-gray-300" />
                      }
                    </div>
                  </div>
                );

                return (
                  <div className="space-y-3">
                    {runCharges.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Run Charges (per unit)</p>
                        <div className="space-y-1">{runCharges.map(renderCharge)}</div>
                      </div>
                    )}
                    {fixedCharges.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Fixed Charges (one-time)</p>
                        <div className="space-y-1">{fixedCharges.map(renderCharge)}</div>
                      </div>
                    )}
                    <div className="text-right text-xs text-gray-500 pt-1">
                      Total Charges: <strong className="text-gray-800">${totals.totalCharges.toFixed(2)}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ARTWORK */}
          {artworks.length > 0 && (
            <div className="px-6 py-4 border-t">
              <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <Image className="w-4 h-4 text-gray-400" />
                Artwork ({artworks.length})
              </h4>
              <div className="space-y-2">
                {artworks.map((art: any) => {
                  const artCharges = productSection.allArtworkCharges[art.id] || [];
                  return (
                    <div key={art.id} className="border rounded-lg bg-white overflow-hidden">
                      <div className="p-2 flex gap-3 items-center">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 flex-shrink-0 bg-gray-50 rounded border overflow-hidden flex items-center justify-center">
                          {art.filePath ? (
                            (() => {
                              const ext = art.filePath.split("?")[0].split(".").pop()?.toLowerCase();
                              const isDesignFile = ["ai", "eps", "psd"].includes(ext || "");
                              const imgSrc = isDesignFile && art.filePath.includes("cloudinary.com")
                                ? getCloudinaryThumbnail(art.filePath, 112, 112)
                                : art.filePath;
                              return <img src={imgSrc} alt={art.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
                            })()
                          ) : (
                            <FileText className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate">{art.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Badge variant="outline" className={`text-[9px] ${art.status === "approved" ? "border-green-300 text-green-700" : art.status === "rejected" ? "border-red-300 text-red-700" : "border-yellow-300 text-yellow-700"}`}>
                              {art.status}
                            </Badge>
                            {art.location && <span className="text-[9px] text-gray-400">{art.location}</span>}
                            {art.artworkType && <span className="text-[9px] text-gray-400">· {art.artworkType}</span>}
                            {artCharges.length > 0 && (
                              <Badge variant="secondary" className="text-[9px]">
                                <DollarSign className="w-2.5 h-2.5 mr-0.5" />{artCharges.length}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Charges */}
                      {artCharges.length > 0 && (
                        <div className="border-t bg-gray-50/50 px-3 py-1.5 text-[10px] text-gray-500 space-y-0.5">
                          {artCharges.map((c: any) => (
                            <div key={c.id} className="flex justify-between">
                              <span>{c.chargeName} <span className="text-gray-400">({c.chargeCategory === "run" ? "per unit" : "one-time"})</span></span>
                              <span className="font-medium text-gray-700">${parseFloat(c.retailPrice || "0").toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Copy Confirmation Dialog */}
      <AlertDialog open={showCopyConfirm} onOpenChange={setShowCopyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Product</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a copy of <strong>{item.productName || "this product"}</strong> including all line items, charges, and artwork. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productSection.duplicateOrderItemMutation.mutate(item.id)}
            >
              Duplicate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
