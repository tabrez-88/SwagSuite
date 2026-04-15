import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { IMPRINT_LOCATIONS, IMPRINT_METHODS } from "@/constants/imprintOptions";
import { marginColorClass, isBelowMinimum, calcMarginPercent } from "@/hooks/useMarginSettings";
import TierPricingPanel from "@/components/sections/TierPricingPanel";
import { DollarSign, ImageIcon, Loader2, Plus, ShieldAlert, Tag, Trash2 } from "lucide-react";
import type { ConfigLine, ProductResult } from "../types";

interface ProductConfigDialogProps {
  selectedProduct: ProductResult | null;
  onClose: () => void;
  configLines: any[];
  configTotalQty: number;
  configTotalCost: number;
  configTotalPrice: number;
  configMargin: number;
  marginSettings: any;
  imprintLocation: string;
  setImprintLocation: (v: string) => void;
  imprintMethod: string;
  setImprintMethod: (v: string) => void;
  productNotes: string;
  setProductNotes: (v: string) => void;
  addConfigLine: () => void;
  removeConfigLine: (id: string) => void;
  updateConfigLine: (id: string, field: keyof ConfigLine, value: any) => void;
  handleConfigCostChange: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  handleConfigMarginChange: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  applyTierToConfigLines: (cost: number, price: number) => void;
  handleAddProduct: () => void;
  addProductMutation: { isPending: boolean };
  sourceBadgeColor: (source: string) => string;
  sourceLabel: (source: string) => string;
}

export function ProductConfigDialog({
  selectedProduct,
  onClose,
  configLines,
  configTotalQty,
  configTotalCost,
  configTotalPrice,
  configMargin,
  marginSettings,
  imprintLocation,
  setImprintLocation,
  imprintMethod,
  setImprintMethod,
  productNotes,
  setProductNotes,
  addConfigLine,
  removeConfigLine,
  updateConfigLine,
  handleConfigCostChange,
  handleConfigMarginChange,
  applyTierToConfigLines,
  handleAddProduct,
  addProductMutation,
  sourceBadgeColor,
  sourceLabel,
}: ProductConfigDialogProps) {
  return (
    <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Configure Product
          </DialogTitle>
        </DialogHeader>

        {selectedProduct && (
          <div className="space-y-6">
            {/* Product Summary */}
            <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
              {selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-20 h-20 object-contain rounded border bg-white"
                />
              ) : (
                <div className="w-20 h-20 bg-muted rounded border flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {selectedProduct.sku && (
                    <Badge variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {selectedProduct.sku}
                    </Badge>
                  )}
                  <Badge className={`text-xs ${sourceBadgeColor(selectedProduct.source)}`}>
                    {sourceLabel(selectedProduct.source)}
                  </Badge>
                  {selectedProduct.supplierName && (
                    <span className="text-sm text-muted-foreground">{selectedProduct.supplierName}</span>
                  )}
                </div>
                {selectedProduct.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{selectedProduct.description}</p>
                )}
              </div>
            </div>

            {/* Imprint Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Imprint Location</Label>
                <Select
                  value={IMPRINT_LOCATIONS.some((o) => o.value === imprintLocation) ? imprintLocation : (imprintLocation ? "__custom__" : "")}
                  onValueChange={(v) => setImprintLocation(v === "__custom__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPRINT_LOCATIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom...</SelectItem>
                  </SelectContent>
                </Select>
                {!IMPRINT_LOCATIONS.some((o) => o.value === imprintLocation) && imprintLocation !== undefined && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom location"
                    value={imprintLocation}
                    onChange={(e) => setImprintLocation(e.target.value)}
                  />
                )}
              </div>
              <div>
                <Label>Imprint Method</Label>
                {selectedProduct.decorationMethods && selectedProduct.decorationMethods.length > 0 ? (
                  <Select
                    value={(selectedProduct.decorationMethods as string[]).includes(imprintMethod) ? imprintMethod : (imprintMethod ? "__custom__" : "")}
                    onValueChange={(v) => setImprintMethod(v === "__custom__" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProduct.decorationMethods.map((m: string) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={IMPRINT_METHODS.some((o) => o.value === imprintMethod) ? imprintMethod : (imprintMethod ? "__custom__" : "")}
                    onValueChange={(v) => setImprintMethod(v === "__custom__" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPRINT_METHODS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {!(selectedProduct.decorationMethods && (selectedProduct.decorationMethods as string[]).includes(imprintMethod))
                  && !IMPRINT_METHODS.some((o) => o.value === imprintMethod)
                  && imprintMethod !== undefined
                  && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom method"
                    value={imprintMethod}
                    onChange={(e) => setImprintMethod(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Supplier Pricing Tiers */}
            {selectedProduct?.pricingTiers && selectedProduct.pricingTiers.length > 0 && (
              <TierPricingPanel
                tiers={selectedProduct.pricingTiers}
                defaultMargin={parseFloat(String(marginSettings?.defaultMargin || "40"))}
                totalQuantity={configTotalQty}
                onApplyTier={applyTierToConfigLines}
              />
            )}

            {/* Size/Color Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Size & Color Breakdown</Label>
                <Button variant="outline" size="sm" onClick={addConfigLine}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Line
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium">Color/Size</th>
                      <th className="text-right p-3 font-medium w-20">QTY</th>
                      <th className="text-right p-3 font-medium w-28">Net Cost</th>
                      <th className="text-right p-3 font-medium w-24">Margin</th>
                      <th className="text-right p-3 font-medium w-28">Retail</th>
                      <th className="text-right p-3 font-medium w-28">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {configLines.map((line) => {
                      const lineTotal = line.quantity * line.unitPrice;
                      const lineMargin = calcMarginPercent(line.unitCost, line.unitPrice);
                      return (
                        <tr key={line.id} className={`border-b last:border-0 ${isBelowMinimum(lineMargin, marginSettings) ? "bg-red-50/30" : ""}`}>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <div className="relative flex-1">
                                <Input className="h-8 text-xs" value={line.color}
                                  onChange={(e) => updateConfigLine(line.id, "color", e.target.value)}
                                  placeholder="Color" list={`colors-${line.id}`} />
                                {(selectedProduct?.colors?.length ?? 0) > 0 && (
                                  <datalist id={`colors-${line.id}`}>
                                    {selectedProduct!.colors!.map(c => <option key={c} value={c} />)}
                                  </datalist>
                                )}
                              </div>
                              <div className="relative w-24">
                                <Input className="h-8 text-xs" value={line.size}
                                  onChange={(e) => updateConfigLine(line.id, "size", e.target.value)}
                                  placeholder="Size" list={`sizes-${line.id}`} />
                                {(selectedProduct?.sizes?.length ?? 0) > 0 && (
                                  <datalist id={`sizes-${line.id}`}>
                                    {selectedProduct!.sizes!.map(s => <option key={s} value={s} />)}
                                  </datalist>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Input className="h-8 text-xs text-right" type="number" min={1} value={line.quantity}
                              onChange={(e) => updateConfigLine(line.id, "quantity", parseInt(e.target.value) || 0)} />
                          </td>
                          <td className="p-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                              <input className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                                type="number" step="0.01" min={0} value={line.unitCost}
                                onChange={(e) => handleConfigCostChange(line.id, e)} />
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="relative">
                              <input className={`w-full h-8 text-xs text-right rounded border bg-white px-2 pr-5 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 ${isBelowMinimum(lineMargin, marginSettings) ? "border-red-300 text-red-600" : "border-gray-200"}`}
                                type="number" step="0.1" min={0} max={99.9}
                                value={parseFloat(lineMargin.toFixed(1))}
                                onChange={(e) => handleConfigMarginChange(line.id, e)} />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                              <input className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 font-semibold"
                                type="number" step="0.01" min={0} value={line.unitPrice}
                                onChange={(e) => updateConfigLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)} />
                            </div>
                          </td>
                          <td className="p-2 text-right">
                            <span className={`text-xs font-semibold ${marginColorClass(lineMargin, marginSettings)}`}>${lineTotal.toFixed(2)}</span>
                          </td>
                          <td className="p-2">
                            {configLines.length > 1 && (
                              <button className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                                onClick={() => removeConfigLine(line.id)}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/50 border-t">
                    <tr>
                      <td className="p-3 text-sm font-semibold">Totals</td>
                      <td className="p-3 text-right text-sm font-semibold">{configTotalQty}</td>
                      <td className="p-3 text-right text-sm text-muted-foreground">${configTotalCost.toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <span className={`text-sm font-semibold ${marginColorClass(configMargin, marginSettings)}`}>
                          {configMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right text-sm font-semibold">${configTotalPrice.toFixed(2)}</td>
                      <td className="p-3 text-right text-sm font-bold">${configTotalPrice.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Minimum Margin Warning */}
            {isBelowMinimum(configMargin, marginSettings) && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-700">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>
                  Margin ({configMargin.toFixed(1)}%) is below the company minimum of {marginSettings.minimumMargin}%.
                  Adding this product will require confirmation.
                </span>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label>Product Notes</Label>
              <Textarea
                value={productNotes}
                onChange={(e) => setProductNotes(e.target.value)}
                placeholder="Special instructions, decoration details, etc."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleAddProduct}
            disabled={addProductMutation.isPending || configLines.length === 0 || configTotalQty === 0}
          >
            {addProductMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <DollarSign className="w-4 h-4 mr-2" />
            )}
            Add to Order — ${configTotalPrice.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
