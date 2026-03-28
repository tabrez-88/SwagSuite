import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  Palette,
  Image,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Percent,
  Edit2,
  Save,
  X,
  Ruler,
  FileText,
  Loader2,
  TrendingUp,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import type { OrderItemLine, OrderAdditionalCharge } from "@shared/schema";
import { IMPRINT_LOCATIONS, IMPRINT_METHODS } from "@/constants/imprintOptions";
import FilePickerDialog from "@/components/modals/FilePickerDialog";
import { isBelowMinimum, calcMarginPercent, applyMargin } from "@/hooks/useMarginSettings";
import type { ProductsSectionProps } from "./types";
import { useProductsSection } from "./hooks";
import { getCloudinaryThumbnail } from "@/lib/media-library";

export default function ProductsSection({ projectId, data, isLocked }: ProductsSectionProps) {
  const h = useProductsSection({ projectId, data, isLocked });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" />
            Products
          </h2>
          <Badge variant="secondary" className="text-xs">
            {h.orderItems.length} {h.orderItems.length === 1 ? "item" : "items"}
          </Badge>
        </div>
        <Button size="sm" onClick={() => h.setLocation(h.addProductPath)} disabled={h.isLocked}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Empty State */}
      {h.orderItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No products in this order yet</p>
            <p className="text-sm mb-4">Click "Add Product" to add items from your catalog</p>
            <Button variant="outline" onClick={() => h.setLocation(h.addProductPath)} disabled={h.isLocked}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {h.orderItems.map((item: any) => {
            const isExpanded = h.expandedItems.has(item.id);
            const itemSupplier = h.getItemSupplier(item);
            const imageUrl = h.getProductImage(item);
            const artworkCount = h.getArtworkCount(item.id);
            const artworks = h.allArtworkItems[item.id] || [];
            const lines: OrderItemLine[] = h.allItemLines[item.id] || [];
            const charges: OrderAdditionalCharge[] = h.allItemCharges[item.id] || [];
            const totals = h.getItemTotals(item);

            return (
              <Card key={item.id} className="overflow-hidden">
                {/* Collapsed Summary Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => h.toggleExpand(item.id)}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 pt-1">
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
                            <p className={`font-semibold ${h.marginColor(totals.margin)}`}>
                              {totals.margin.toFixed(1)}%
                              {isBelowMinimum(totals.margin, h.marginSettings) && (
                                <span title={`Below minimum margin (${h.marginSettings.minimumMargin}%)`}><AlertTriangle className="inline w-3 h-3 text-red-500 ml-0.5" /></span>
                              )}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={h.isLocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              h.startEditItem(item);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={h.isLocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              h.setDeletingProduct(item);
                              h.setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {!isExpanded && (
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          {item.color && (
                            <span className="flex items-center gap-1">
                              <Palette className="w-3 h-3" /> {item.color}
                            </span>
                          )}
                          {item.size && (
                            <span className="flex items-center gap-1">
                              <Ruler className="w-3 h-3" /> {item.size}
                            </span>
                          )}
                          {item.imprintMethod && (
                            <span>{item.imprintMethod}</span>
                          )}
                          {item.imprintLocation && (
                            <span>{item.imprintLocation}</span>
                          )}
                          {charges.length > 0 && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {charges.length} charge{charges.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50">
                    {/* Product meta */}
                    <div className="px-6 py-3 border-b bg-white">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400 text-xs">Color</span>
                          <p className="font-medium">{item.color || "--"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Size</span>
                          <p className="font-medium">{item.size || "--"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Imprint Method</span>
                          <p className="font-medium">{item.imprintMethod || "--"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Imprint Location</span>
                          <p className="font-medium">{item.imprintLocation || "--"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Notes</span>
                          <p className="font-medium text-xs">{item.notes || "--"}</p>
                        </div>
                      </div>
                    </div>

                    {/* LINE ITEMS TABLE */}
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <Ruler className="w-4 h-4 text-gray-400" />
                          Size / Color Breakdown
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={h.isLocked}
                          onClick={(e) => {
                            e.stopPropagation();
                            h.addLineMutation.mutate({
                              orderItemId: item.id,
                              line: {
                                color: "",
                                size: "",
                                quantity: 1,
                                cost: item.cost || "0",
                                unitPrice: item.unitPrice || "0",
                                totalPrice: item.unitPrice || "0",
                                margin: "0",
                              },
                            });
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Line
                        </Button>
                      </div>

                      {lines.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b text-xs">
                              <tr>
                                <th className="text-left p-2.5 font-medium">Color</th>
                                <th className="text-left p-2.5 font-medium">Size</th>
                                <th className="text-right p-2.5 font-medium w-20">Qty</th>
                                <th className="text-right p-2.5 font-medium w-24">Cost</th>
                                <th className="text-right p-2.5 font-medium w-24">Price</th>
                                <th className="text-right p-2.5 font-medium w-20">Margin</th>
                                <th className="text-right p-2.5 font-medium w-24">Total</th>
                                <th className="w-16"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {lines.map((line) => {
                                const isEditing = h.editingLine === line.id;
                                const qty = line.quantity || 0;
                                const cost = parseFloat(line.cost || "0");
                                const price = parseFloat(line.unitPrice || "0");
                                const lineTotal = qty * price;
                                const m = h.calcMargin(cost, price);

                                if (isEditing) {
                                  const eQty = h.editLineData.quantity || 0;
                                  const eCost = parseFloat(h.editLineData.cost as string || "0");
                                  const ePrice = parseFloat(h.editLineData.unitPrice as string || "0");
                                  const eMargin = h.calcMargin(eCost, ePrice);

                                  return (
                                    <tr key={line.id} className="border-b bg-blue-50/30">
                                      <td className="p-1.5">
                                        <Input className="h-7 text-xs" value={h.editLineData.color || ""} onChange={(e) => h.setEditLineData(d => ({ ...d, color: e.target.value }))} />
                                      </td>
                                      <td className="p-1.5">
                                        <Input className="h-7 text-xs" value={h.editLineData.size || ""} onChange={(e) => h.setEditLineData(d => ({ ...d, size: e.target.value }))} />
                                      </td>
                                      <td className="p-1.5">
                                        <Input className="h-7 text-xs text-right" type="number" min={0} value={h.editLineData.quantity ?? 0} onChange={(e) => h.setEditLineData(d => ({ ...d, quantity: parseInt(e.target.value) || 0 }))} />
                                      </td>
                                      <td className="p-1.5">
                                        <Input className="h-7 text-xs text-right" type="number" step="0.01" value={h.editLineData.cost || ""} onChange={(e) => h.setEditLineData(d => ({ ...d, cost: e.target.value }))} />
                                      </td>
                                      <td className="p-1.5">
                                        <Input className="h-7 text-xs text-right" type="number" step="0.01" value={h.editLineData.unitPrice || ""} onChange={(e) => h.setEditLineData(d => ({ ...d, unitPrice: e.target.value }))} />
                                      </td>
                                      <td className="p-1.5 text-right">
                                        <span className={`text-xs font-medium ${h.marginColor(eMargin)}`}>{eMargin.toFixed(1)}%</span>
                                        {isBelowMinimum(eMargin, h.marginSettings) && (
                                          <AlertTriangle className="inline w-3 h-3 text-red-500 ml-0.5" />
                                        )}
                                      </td>
                                      <td className="p-1.5 text-right text-xs font-medium">${(eQty * ePrice).toFixed(2)}</td>
                                      <td className="p-1.5">
                                        <div className="flex gap-0.5">
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => h.handleSaveEditLine(line)} disabled={h.updateLineMutation.isPending}>
                                            {h.updateLineMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 text-green-600" />}
                                          </Button>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => h.setEditingLine(null)}>
                                            <X className="w-3 h-3 text-gray-400" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={line.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                    <td className="p-2.5 text-xs">{line.color || "--"}</td>
                                    <td className="p-2.5 text-xs">{line.size || "--"}</td>
                                    <td className="p-2.5 text-right text-xs font-medium">{qty}</td>
                                    <td className="p-2.5 text-right text-xs text-gray-500">${cost.toFixed(2)}</td>
                                    <td className="p-2.5 text-right text-xs font-medium">${price.toFixed(2)}</td>
                                    <td className="p-2.5 text-right">
                                      <span className={`text-xs font-medium ${h.marginColor(m)}`}>{m.toFixed(1)}%</span>
                                      {isBelowMinimum(m, h.marginSettings) && (
                                        <span title={`Below minimum margin (${h.marginSettings.minimumMargin}%)`}><AlertTriangle className="inline w-3 h-3 text-red-500 ml-0.5" /></span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-right text-xs font-medium">${lineTotal.toFixed(2)}</td>
                                    <td className="p-1.5">
                                      <div className="flex gap-0.5">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={h.isLocked} onClick={() => h.startEditLine(line)}>
                                          <Edit2 className="w-3 h-3 text-gray-400" />
                                        </Button>
                                        <Button
                                          variant="ghost" size="sm" className="h-6 w-6 p-0"
                                          disabled={h.isLocked}
                                          onClick={() => h.deleteLineMutation.mutate({ lineId: line.id, orderItemId: line.orderItemId })}
                                        >
                                          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t text-xs">
                              <tr>
                                <td colSpan={2} className="p-2.5 font-semibold">Subtotal</td>
                                <td className="p-2.5 text-right font-semibold">{totals.totalQty}</td>
                                <td className="p-2.5 text-right text-gray-500">${totals.totalCost.toFixed(2)}</td>
                                <td className="p-2.5"></td>
                                <td className="p-2.5 text-right">
                                  <span className={`font-semibold ${h.marginColor(totals.margin)}`}>{totals.margin.toFixed(1)}%</span>
                                </td>
                                <td className="p-2.5 text-right font-semibold">${totals.totalRevenue.toFixed(2)}</td>
                                <td></td>
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

                    {/* ADDITIONAL CHARGES */}
                    <div className="px-6 py-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          Additional Charges
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={h.isLocked}
                          onClick={(e) => {
                            e.stopPropagation();
                            h.setAddChargeForItem(item.id);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Charge
                        </Button>
                      </div>

                      {charges.length > 0 ? (
                        <div className="space-y-1">
                          {charges.map((charge) => (
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
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">${parseFloat(charge.amount || "0").toFixed(2)}</span>
                                <Button
                                  variant="ghost" size="sm" className="h-6 w-6 p-0"
                                  disabled={h.isLocked}
                                  title={charge.displayToClient !== false ? "Visible to client" : "Hidden from client"}
                                  onClick={() => h.toggleChargeDisplayMutation.mutate({
                                    chargeId: charge.id,
                                    orderItemId: charge.orderItemId,
                                    displayToClient: charge.displayToClient === false,
                                  })}
                                >
                                  {charge.displayToClient !== false
                                    ? <Eye className="w-3 h-3 text-blue-400" />
                                    : <EyeOff className="w-3 h-3 text-gray-300" />
                                  }
                                </Button>
                                <Button
                                  variant="ghost" size="sm" className="h-6 w-6 p-0"
                                  disabled={h.isLocked}
                                  onClick={() => h.deleteChargeMutation.mutate({ chargeId: charge.id, orderItemId: charge.orderItemId })}
                                >
                                  <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="text-right text-xs text-gray-500 pt-1">
                            Total Charges: <strong className="text-gray-800">${totals.totalCharges.toFixed(2)}</strong>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No additional charges</p>
                      )}
                    </div>

                    {/* ARTWORK */}
                    <div className="px-6 py-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <Image className="w-4 h-4 text-gray-400" />
                          Artwork {artworks.length > 0 && `(${artworks.length})`}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={h.isLocked}
                          onClick={(e) => {
                            e.stopPropagation();
                            h.setPickingArtworkForItem(item.id);
                          }}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Add Artwork
                        </Button>
                      </div>
                      {artworks.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {artworks.map((art: any) => (
                            <div key={art.id} className="border rounded-lg p-2 bg-white w-36 group relative">
                              {art.filePath ? (
                                (() => {
                                  const ext = art.filePath.split("?")[0].split(".").pop()?.toLowerCase();
                                  const isDesignFile = ["ai", "eps", "psd"].includes(ext || "");
                                  const imgSrc = isDesignFile && art.filePath.includes("cloudinary.com")
                                    ? getCloudinaryThumbnail(art.filePath, 280, 160)
                                    : art.filePath;
                                  return (
                                    <img
                                      src={imgSrc}
                                      alt={art.name}
                                      className="w-full h-20 object-contain rounded mb-1.5"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        target.parentElement?.insertAdjacentHTML(
                                          "afterbegin",
                                          `<div class="w-full h-20 bg-gray-100 rounded flex items-center justify-center mb-1.5"><span class="text-[10px] text-gray-400 uppercase font-medium">.${ext || "file"}</span></div>`
                                        );
                                      }}
                                    />
                                  );
                                })()
                              ) : (
                                <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center mb-1.5">
                                  <FileText className="w-6 h-6 text-gray-300" />
                                </div>
                              )}
                              <p className="text-[10px] font-medium truncate">{art.name}</p>
                              <div className="flex items-center justify-between mt-0.5">
                                <div className="flex items-center gap-1">
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] ${art.status === "approved" ? "border-green-300 text-green-700" :
                                        art.status === "rejected" ? "border-red-300 text-red-700" :
                                          "border-yellow-300 text-yellow-700"
                                      }`}
                                  >
                                    {art.status}
                                  </Badge>
                                  {art.location && <span className="text-[9px] text-gray-400">{art.location}</span>}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  disabled={h.isLocked}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    h.deleteArtworkMutation.mutate({ artworkId: art.id, orderItemId: item.id });
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No artwork yet — click "Add Artwork" to upload</p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {/* ORDER TOTALS */}
          <Card className={`${h.marginBg(h.orderMargin)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Items</span>
                    <p className="font-semibold">{h.orderItems.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Total Qty</span>
                    <p className="font-semibold">{h.orderTotals.totalQty}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Total Cost</span>
                    <p className="font-semibold text-gray-600">${h.orderTotals.totalCost.toFixed(2)}</p>
                  </div>
                  {h.orderTotals.totalCharges > 0 && (
                    <div>
                      <span className="text-gray-500 text-xs">Charges</span>
                      <p className="font-semibold">${h.orderTotals.totalCharges.toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 text-xs">Margin</span>
                    <p className={`font-bold flex items-center gap-1 ${h.marginColor(h.orderMargin)}`}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      {h.orderMargin.toFixed(1)}%
                      {isBelowMinimum(h.orderMargin, h.marginSettings) && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Revenue</span>
                  <p className="text-sm font-semibold text-gray-600">${(h.orderTotals.subtotal + h.orderTotals.totalCharges).toFixed(2)}</p>
                </div>
              </div>
              {isBelowMinimum(h.orderMargin, h.marginSettings) && (
                <div className="mt-2 pt-2 border-t border-red-200 flex items-center gap-2 text-xs text-red-600">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Overall order margin is below the company minimum of {h.marginSettings.minimumMargin}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ADD CHARGE DIALOG */}
      <Dialog open={!!h.addChargeForItem} onOpenChange={(open) => !open && h.setAddChargeForItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Additional Charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description *</Label>
              <Input
                value={h.newCharge.description}
                onChange={(e) => h.setNewCharge(c => ({ ...c, description: e.target.value }))}
                placeholder="e.g., Setup Fee, Rush Charge"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={h.newCharge.chargeType} onValueChange={(v) => h.setNewCharge(c => ({ ...c, chargeType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Fee</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={h.newCharge.amount}
                  onChange={(e) => h.setNewCharge(c => ({ ...c, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="vendor-charge"
                checked={h.newCharge.isVendorCharge}
                onChange={(e) => h.setNewCharge(c => ({ ...c, isVendorCharge: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="vendor-charge" className="font-normal text-sm">This is a vendor charge (cost, not revenue)</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="display-to-client"
                checked={h.newCharge.displayToClient}
                onChange={(e) => h.setNewCharge(c => ({ ...c, displayToClient: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="display-to-client" className="font-normal text-sm">Display to client (visible in presentation)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => h.setAddChargeForItem(null)}>Cancel</Button>
            <Button
              disabled={!h.newCharge.description || h.newCharge.amount <= 0 || h.addChargeMutation.isPending}
              onClick={() => {
                if (!h.addChargeForItem) return;
                h.addChargeMutation.mutate({
                  orderItemId: h.addChargeForItem,
                  charge: {
                    description: h.newCharge.description,
                    chargeType: h.newCharge.chargeType,
                    amount: h.newCharge.amount.toFixed(2),
                    isVendorCharge: h.newCharge.isVendorCharge,
                    displayToClient: h.newCharge.displayToClient,
                  },
                }, {
                  onSuccess: () => {
                    h.setAddChargeForItem(null);
                    h.setNewCharge({ description: "", chargeType: "flat", amount: 0, isVendorCharge: false, displayToClient: true });
                  },
                });
              }}
            >
              {h.addChargeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE ITEM DIALOG */}
      <AlertDialog open={h.isDeleteDialogOpen} onOpenChange={h.setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Remove Item from Order?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{h.deletingProduct?.productName}</strong> from this order?
              {h.deletingProduct?.productSku && (
                <span className="block mt-1 text-xs text-gray-500">SKU: {h.deletingProduct.productSku}</span>
              )}
              <span className="block mt-2 text-orange-600 font-medium">
                This will remove the item and all its line items, charges, and artwork from this order.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { h.setDeletingProduct(null); h.setIsDeleteDialogOpen(false); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => h.deletingProduct && h.deleteOrderItemMutation.mutate(h.deletingProduct.id, {
                onSuccess: () => { h.setIsDeleteDialogOpen(false); h.setDeletingProduct(null); },
                onError: () => h.setIsDeleteDialogOpen(false),
              })}
              className="bg-red-600 hover:bg-red-700"
              disabled={h.deleteOrderItemMutation.isPending}
            >
              {h.deleteOrderItemMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removing...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Remove Item</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EDIT ITEM DIALOG */}
      <Dialog open={!!h.editingItem} onOpenChange={(open) => !open && h.setEditingItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              Edit Product
            </DialogTitle>
          </DialogHeader>
          {h.editingItem && (
            <div className="space-y-5">
              {/* Product Info Header */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                {(() => {
                  const img = h.getProductImage(h.editingItem);
                  return img ? (
                    <img src={img} alt={h.editingItem.productName} className="w-16 h-16 object-contain rounded border bg-white" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  );
                })()}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{h.editingItem.productName || "Unnamed Product"}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {h.editingItem.productSku && (
                      <Badge variant="outline" className="text-xs">{h.editingItem.productSku}</Badge>
                    )}
                    {h.getItemSupplier(h.editingItem) && (
                      <span className="text-sm text-gray-500">{h.getItemSupplier(h.editingItem)?.name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Imprint Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Imprint Method</Label>
                  <Select value={h.editItemData.imprintMethod || ""} onValueChange={(v) => h.setEditItemData((d: any) => ({ ...d, imprintMethod: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPRINT_METHODS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Imprint Location</Label>
                  <Select value={h.editItemData.imprintLocation || ""} onValueChange={(v) => h.setEditItemData((d: any) => ({ ...d, imprintLocation: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPRINT_LOCATIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Size/Color Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Size & Color Breakdown</Label>
                  <Button variant="outline" size="sm" onClick={h.addEditDialogLine}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Line
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 font-medium">Color</th>
                        <th className="text-left p-3 font-medium">Size</th>
                        <th className="text-right p-3 font-medium w-20">Qty</th>
                        <th className="text-right p-3 font-medium w-28">Unit Cost</th>
                        <th className="text-right p-3 font-medium w-28">Unit Price</th>
                        <th className="text-right p-3 font-medium w-20">Margin</th>
                        <th className="text-right p-3 font-medium w-28">Line Total</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {h.editDialogLines.map((line: any) => {
                        const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
                        const lineMargin = line.unitPrice > 0
                          ? ((line.unitPrice - line.cost) / line.unitPrice * 100) : 0;
                        return (
                          <tr key={line.id} className="border-b last:border-0">
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs"
                                value={line.color}
                                onChange={(e) => h.updateEditDialogLine(line.id, "color", e.target.value)}
                                placeholder="Color"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs"
                                value={line.size}
                                onChange={(e) => h.updateEditDialogLine(line.id, "size", e.target.value)}
                                placeholder="Size"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                min={0}
                                value={line.quantity}
                                onChange={(e) => h.updateEditDialogLine(line.id, "quantity", parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.cost}
                                onChange={(e) => h.handleEditDialogCostChange(line.id, e)}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.unitPrice}
                                onChange={(e) => h.updateEditDialogLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2">
                              <div className="relative">
                                <Input
                                  className={`h-8 text-xs text-right pr-5 ${isBelowMinimum(lineMargin, h.marginSettings) ? "border-red-300 text-red-600" : ""}`}
                                  type="number"
                                  step="0.1"
                                  min={0}
                                  max={99.9}
                                  value={parseFloat(lineMargin.toFixed(1))}
                                  onChange={(e) => h.handleEditDialogMarginChange(line.id, e)}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              <span className="text-xs font-medium">${lineTotal.toFixed(2)}</span>
                            </td>
                            <td className="p-2">
                              {h.editDialogLines.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => h.removeEditDialogLine(line.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td colSpan={2} className="p-3 text-sm font-semibold">Totals</td>
                        <td className="p-3 text-right text-sm font-semibold">{h.editDialogTotals.qty}</td>
                        <td className="p-3 text-right text-sm text-gray-500">${h.editDialogTotals.cost.toFixed(2)}</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right">
                          <span className={`text-sm font-semibold ${h.marginColor(h.editDialogMargin)}`}>
                            {h.editDialogMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right text-sm font-semibold">${h.editDialogTotals.revenue.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Margin Summary */}
              <div className={`rounded-lg p-3 ${h.marginBg(h.editDialogMargin)} flex items-center justify-between text-sm`}>
                <div className="flex items-center gap-6">
                  <span className="text-gray-600">
                    Total Qty: <strong>{h.editDialogTotals.qty}</strong>
                  </span>
                  <span className="text-gray-600">
                    Total Cost: <strong>${h.editDialogTotals.cost.toFixed(2)}</strong>
                  </span>
                  <span className="text-gray-600">
                    Margin: <strong className={h.marginColor(h.editDialogMargin)}>{h.editDialogMargin.toFixed(1)}%</strong>
                  </span>
                  <span className="text-gray-600">
                    Profit: <strong className="text-green-700">${(h.editDialogTotals.revenue - h.editDialogTotals.cost).toFixed(2)}</strong>
                  </span>
                </div>
                <span className="font-bold text-blue-600 text-base">${h.editDialogTotals.revenue.toFixed(2)}</span>
              </div>

              {/* Minimum Margin Warning */}
              {isBelowMinimum(h.editDialogMargin, h.marginSettings) && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Margin ({h.editDialogMargin.toFixed(1)}%) is below the company minimum of {h.marginSettings.minimumMargin}%.
                    Saving will require confirmation.
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={h.editItemData.notes}
                  onChange={(e: any) => h.setEditItemData((d: any) => ({ ...d, notes: e.target.value }))}
                  placeholder="Product-specific notes..."
                  rows={3}
                />
              </div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => h.setEditingItem(null)}>Cancel</Button>
            <Button
              onClick={h.handleSaveEditItem}
              disabled={h.updateOrderItemMutation.isPending || h.updateLineMutation.isPending || h.addLineMutation.isPending}
            >
              {(h.updateOrderItemMutation.isPending || h.updateLineMutation.isPending || h.addLineMutation.isPending) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ARTWORK UPLOAD DIALOG */}
      <FilePickerDialog
        open={!!h.pickingArtworkForItem}
        onClose={() => h.setPickingArtworkForItem(null)}
        onSelect={h.handleArtworkFilePicked}
        multiple={false}
        contextProjectId={h.projectId}
        title="Select Artwork File"
      />

      {/* Artwork Metadata Dialog */}
      <Dialog open={!!h.artPickedFile} onOpenChange={(open) => !open && h.resetArtForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Artwork Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {h.artPickedFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={h.artPickedFile.filePath}
                  alt={h.artPickedFile.fileName}
                  className="w-16 h-16 object-contain rounded border bg-white"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-sm text-gray-600 truncate flex-1">{h.artPickedFile.fileName}</p>
              </div>
            )}
            <div>
              <Label>Name</Label>
              <Input value={h.artUploadName} onChange={(e) => h.setArtUploadName(e.target.value)} placeholder="e.g., Logo Front" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Decoration Location <span className="text-red-500">*</span></Label>
                <Select value={h.artUploadLocation} onValueChange={h.setArtUploadLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPRINT_LOCATIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Imprint Method <span className="text-red-500">*</span></Label>
                <Select value={h.artUploadMethod} onValueChange={h.setArtUploadMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPRINT_METHODS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Design Size</Label>
                <Input value={h.artUploadSize} onChange={(e) => h.setArtUploadSize(e.target.value)} placeholder='e.g., 3" x 3"' />
              </div>
              <div>
                <Label>Design Color</Label>
                <Input value={h.artUploadColor} onChange={(e) => h.setArtUploadColor(e.target.value)} placeholder="e.g., White, PMS 186" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={h.resetArtForm}>Cancel</Button>
            <Button
              disabled={h.createArtworkMutation.isPending || !h.artPickedFile || !h.artUploadLocation || !h.artUploadMethod}
              onClick={h.handleCreateArtwork}
            >
              {h.createArtworkMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                "Add Artwork"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MARGIN WARNING CONFIRMATION DIALOG */}
      <AlertDialog open={!!h.marginWarningAction} onOpenChange={(open) => { if (!open) h.dismissMarginWarning(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Below Minimum Margin
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  The margin for this product is <strong className="text-red-600">{h.marginWarningValue.toFixed(1)}%</strong>, which is below
                  the company minimum of <strong>{h.marginSettings.minimumMargin}%</strong>.
                </p>
                <p className="mt-2 text-orange-600 font-medium">
                  Are you sure you want to save with this margin? This may require manager approval.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={h.dismissMarginWarning}>
              Go Back & Adjust
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={h.confirmMarginWarning}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Save Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
