import MatrixChargePicker from "@/components/modals/MatrixChargePicker";
import EditProductPage from "@/components/sections/EditProductPage";
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
import { getCloudinaryThumbnail } from "@/lib/media-library";
import { calcMarginPercent } from "@/lib/pricing";
import { formatLabel } from "@/lib/utils";
import type { OrderAdditionalCharge, OrderItemLine } from "@shared/schema";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Grid3X3,
  Image,
  Lock,
  Package,
  Palette,
  Ruler,
  Trash2
} from "lucide-react";
import { useState } from "react";
import type { useProductsSection } from "../hooks";

interface OrderItemCardProps {
  item: any;
  productSection: ReturnType<typeof useProductsSection>;
}

export default function OrderItemCard({ item, productSection }: OrderItemCardProps) {
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [matrixPickerTarget, setMatrixPickerTarget] = useState<{
    artworkId: string;
    chargeId: string;
    chargeName: string;
    chargeType: "run" | "fixed";
    currentMargin?: number;
  } | null>(null);
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
                      setIsEditing(true);
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
                  <p className="font-semibold text-blue-600">${totals.itemSellGrandTotal.toFixed(2)}</p>
                </div>
                {totals.taxRate > 0 && (
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase">Tax ({totals.taxRate}%)</p>
                    <p className="font-semibold text-gray-500">${totals.taxAmount.toFixed(2)}</p>
                  </div>
                )}
                {totals.taxRate > 0 && (
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase">Total</p>
                    <p className="font-bold text-gray-900">${totals.grandTotalWithTax.toFixed(2)}</p>
                  </div>
                )}
                <div className="text-center" title={`Min: ${productSection.marginSettings.minimumMargin}% | Target: ${productSection.marginSettings.defaultMargin}%`}>
                  <p className="text-[10px] text-gray-400 uppercase">Margin</p>
                  <p className={`font-semibold `}>
                    {totals.itemMarginPercent.toFixed(1)}%
                    {/* {isBelowMinimum(totals.itemMarginPercent, productSection.marginSettings) && (
                      <span title={`Below minimum margin (${productSection.marginSettings.minimumMargin}%) — Target: ${productSection.marginSettings.defaultMargin}%`}><AlertTriangle className="inline w-3 h-3 text-red-500 ml-0.5" /></span>
                    )} */}
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
                            <span className={`text-xs font-medium`}>{m.toFixed(1)}%</span>
                            {/* {isBelowMinimum(m, productSection.marginSettings) && (
                              <span title={`Below minimum margin (${productSection.marginSettings.minimumMargin}%)`}><AlertTriangle className="inline w-3 h-3 text-red-500 ml-0.5" /></span>
                            )} */}
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
                      <td className="p-2.5 text-right text-gray-500">${totals.productCostTotal.toFixed(2)}</td>
                      <td className="p-2.5"></td>
                      <td className="p-2.5 text-right">
                        <span className={`font-semibold`}>{calcMarginPercent(totals.productSellTotal, totals.productCostTotal).toFixed(1)}%</span>
                      </td>
                      <td className="p-2.5 text-right font-semibold">${totals.productSellTotal.toFixed(2)}</td>
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
                  <span>Total: <strong className="text-blue-600">${totals.productSellTotal.toFixed(2)}</strong></span>
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

                const renderCharge = (charge: any) => {
                  const cNetCost = parseFloat(charge.netCost || "0");
                  const cRetail = parseFloat(charge.retailPrice || charge.amount || "0");
                  const cMargin = parseFloat(charge.margin || "0");
                  const cQty = charge.chargeCategory === "run" ? (item.quantity || 1) : (charge.quantity || 1);
                  return (
                  <div key={charge.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{charge.description}</span>
                      {charge.includeInUnitPrice && (
                        <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600 shrink-0">
                          {charge.chargeCategory === "run" ? "In price" : "In margin"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex w-fit gap-2 items-center">
                      {cNetCost > 0 && (
                        <span className="text-xs text-gray-400">Cost: ${cNetCost.toFixed(2)}</span>
                      )}
                      {cMargin > 0 && (
                        <span className={`text-xs font-semibold`}>{cMargin.toFixed(1)}%</span>
                      )}
                      <span className={`font-semibold ${charge.includeInUnitPrice ? "text-gray-400" : ""}`}>
                        ${cRetail.toFixed(2)}{cQty > 1 ?` x${cQty}` : ""}
                      </span>
                      {charge.displayToClient !== false
                        ? <Eye className="w-3 h-3 text-blue-400" />
                        : <EyeOff className="w-3 h-3 text-gray-300" />
                      }
                    </div>
                  </div>
                  );
                };

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
                      Total Charges: <strong className="text-gray-800">${totals.chargeSellTotal.toFixed(2)}</strong>
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
                        <div
                          className={`w-14 h-14 flex-shrink-0 bg-gray-50 rounded border overflow-hidden flex items-center justify-center ${art.filePath ? "cursor-pointer hover:ring-2 hover:ring-blue-300 transition-shadow" : ""}`}
                          onClick={() => art.filePath && productSection.setPreviewFile({ name: art.name || art.fileName || "Artwork", url: art.filePath })}
                        >
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
                          <p
                            className={`text-[11px] font-medium truncate ${art.filePath ? "cursor-pointer hover:text-blue-600 hover:underline" : ""}`}
                            onClick={() => art.filePath && productSection.setPreviewFile({ name: art.name || art.fileName || "Artwork", url: art.filePath })}
                          >{art.name}</p>
                          <div className="flex flex-col items-start gap-1.5 mt-0.5 flex-wrap">
                            <Badge variant="outline" className={`text-[9px] ${art.status === "approved" ? "border-green-300 text-green-700" : art.status === "rejected" ? "border-red-300 text-red-700" : "border-yellow-300 text-yellow-700"}`}>
                              {formatLabel(art.status)}
                            </Badge>
                            {/* Method header */}
                            {art.artworkType && (
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                <Palette className="w-3 h-3" />
                                {art.location && <span>· Location: <strong className="text-gray-700">{formatLabel(art.location)}</strong></span>}
                                <span>Method: <strong className="text-gray-700">{formatLabel(art.artworkType)}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Charges — informative breakdown per charge */}
                      {artCharges.length > 0 && (() => {
                        // Group by category for visual separation
                        const runArtCharges = artCharges.filter((c: any) => c.chargeCategory === "run");
                        const fixedArtCharges = artCharges.filter((c: any) => c.chargeCategory === "fixed");

                        // Per-charge totals: sell, cost, margin
                        const renderArtCharge = (c: any) => {
                          const isRun = c.chargeCategory === "run";
                          const qty = isRun ? (totals.totalQty || 1) : (c.quantity || 1);
                          const sellPerUnit = parseFloat(c.retailPrice || "0");
                          const costPerUnit = parseFloat(c.netCost || "0");
                          const sellTotal = sellPerUnit * qty;
                          const costTotal = costPerUnit * qty;
                          const profit = sellTotal - costTotal;
                          const marginPct = sellTotal > 0 ? (profit / sellTotal) * 100 : 0;
                          const isLoss = profit < 0;
                          const isHidden = c.displayMode !== "display_to_client";

                          return (
                            <div key={c.id} className={`border rounded p-2 ${isLoss ? "bg-red-50 border-red-200" : "bg-white"}`}>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <button
                                    className="text-blue-400 hover:text-blue-600 flex-shrink-0"
                                    title="Select pricing from decorator matrix"
                                    onClick={() => setMatrixPickerTarget({
                                      artworkId: art.id,
                                      chargeId: c.id,
                                      chargeName: c.chargeName || (isRun ? "Imprint Cost" : "Setup Cost"),
                                      chargeType: isRun ? "run" : "fixed",
                                      currentMargin: parseFloat(c.margin || "0"),
                                    })}
                                  >
                                    <Grid3X3 className="w-3 h-3" />
                                  </button>
                                  <span className="font-medium text-gray-800 text-[11px] truncate">{formatLabel(c.chargeName) || (isRun ? "Imprint Cost" : "Setup Cost")}</span>
                                  <Badge variant="outline" className={`text-[8px] flex-shrink-0 ${isRun ? "border-blue-300 text-blue-700" : "border-purple-300 text-purple-700"}`}>
                                    {isRun ? "PER UNIT" : "ONE-TIME"}
                                  </Badge>
                                  {isHidden && (
                                    <Badge variant="outline" className="text-[8px] flex-shrink-0 border-gray-300 text-gray-500" title="Hidden from client (absorbed into margin)">
                                      <EyeOff className="w-2.5 h-2.5" />
                                    </Badge>
                                  )}
                                </div>
                                <span className={`font-bold text-[11px] flex-shrink-0`}>
                                  Sell Total : ${sellTotal.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 text-[9px] text-gray-500 pl-5">
                                <span>
                                  ${costPerUnit.toFixed(2)} cost × {qty} = <span className="text-gray-600">${costTotal.toFixed(2)}</span>
                                  {" → "}
                                  ${sellPerUnit.toFixed(2)} sell × {qty}
                                </span>
                                <span className={`font-semibold `}>
                                  Margin : {marginPct.toFixed(1)}%
                                  {isLoss && <AlertTriangle className="inline w-2.5 h-2.5 ml-0.5" />}
                                </span>
                              </div>
                            </div>
                          );
                        };

                        // Per-artwork rollup
                        let artSellTotal = 0;
                        let artCostTotal = 0;
                        for (const c of artCharges) {
                          const isRun = c.chargeCategory === "run";
                          const qty = isRun ? (totals.totalQty || 1) : (c.quantity || 1);
                          // Count all revenue-generating charges (exclude only subtract_from_margin)
                          if (c.displayMode !== "subtract_from_margin") {
                            artSellTotal += parseFloat(c.retailPrice || "0") * qty;
                          }
                          artCostTotal += parseFloat(c.netCost || "0") * qty;
                        }
                        const artProfit = artSellTotal - artCostTotal;
                        const artMarginPct = artSellTotal > 0 ? (artProfit / artSellTotal) * 100 : 0;
                        const artIsLoss = artProfit < 0;

                        return (
                          <div className="border-t bg-gray-50/50 px-3 py-2 space-y-2">
                            

                            {/* Run charges */}
                            {runArtCharges.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Per-Unit Charges</p>
                                {runArtCharges.map(renderArtCharge)}
                              </div>
                            )}

                            {/* Fixed charges */}
                            {fixedArtCharges.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">One-Time Charges</p>
                                {fixedArtCharges.map(renderArtCharge)}
                              </div>
                            )}

                            {/* Per-artwork rollup */}
                            <div className={`flex justify-between items-center pt-1.5 border-t text-[10px] `}>
                              <span>
                                Decoration subtotal:
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="text-gray-500">cost ${artCostTotal.toFixed(2)} →</span>
                                <strong>${artSellTotal.toFixed(2)}</strong>
                                <span className={`font-semibold `}>
                                  ({artMarginPct.toFixed(1)}%)
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* ITEM TOTAL SUMMARY (with tax if applicable) */}
          <div className="px-6 py-3 border-t bg-gray-100/50">
            <div className="flex justify-end gap-6 text-xs">
              <div className="text-right">
                <span className="text-gray-500">Revenue:</span>{" "}
                <span className="font-semibold text-blue-600">${totals.itemSellGrandTotal.toFixed(2)}</span>
              </div>
              {totals.taxRate > 0 && (
                <div className="text-right">
                  <span className="text-gray-500">Tax ({totals.taxRate}%):</span>{" "}
                  <span className="font-semibold text-gray-600">${totals.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {totals.taxRate > 0 && (
                <div className="text-right">
                  <span className="text-gray-500">Total:</span>{" "}
                  <span className="font-bold text-gray-900">${totals.grandTotalWithTax.toFixed(2)}</span>
                </div>
              )}
              <div className="text-right">
                <span className="text-gray-500">Margin:</span>{" "}
                <span className={`font-semibold`}>
                  {totals.itemMarginPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
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
      {/* Per-charge Matrix Picker */}
      {matrixPickerTarget && (() => {
        const supplierId = item.supplierId || productSection.allProducts.find((p: any) => p.id === item.productId)?.supplierId;
        const supplierName = productSection.getItemSupplier(item)?.name || "Supplier";
        if (!supplierId) return null;
        return (
          <MatrixChargePicker
            open={true}
            onClose={() => setMatrixPickerTarget(null)}
            supplierId={supplierId}
            supplierName={supplierName}
            chargeType={matrixPickerTarget.chargeType}
            artworkId={matrixPickerTarget.artworkId}
            chargeId={matrixPickerTarget.chargeId}
            chargeName={matrixPickerTarget.chargeName}
            currentMargin={matrixPickerTarget.currentMargin}
            quantity={totals.totalQty || 1}
            projectId={productSection.projectId}

          />
        );
      })()}

      {isEditing && (
        <EditProductPage
          open
          onClose={() => setIsEditing(false)}
          projectId={productSection.projectId}
          itemId={item.id}
          data={productSection.data}
        />
      )}
    </Card>
  );
}
