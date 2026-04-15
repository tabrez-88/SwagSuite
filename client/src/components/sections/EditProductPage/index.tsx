import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isBelowMinimum } from "@/hooks/useMarginSettings";
import { getCloudinaryThumbnail } from "@/lib/media-library";
import { calcMarginPercent, getDecorationSubtotal } from "@/lib/pricing";
import { getQueryFn } from "@/lib/queryClient";
import { formatLabel } from "@/lib/utils";
import type { ProjectData } from "@/types/project-types";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Grid3X3,
  Image,
  Loader2,
  Lock,
  LockOpen,
  Package,
  Palette,
  Pencil,
  Plus,
  Repeat,
  Ruler,
  Save,
  Trash2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useEditProductPage } from "./hooks";
import { AddEditChargeDialog } from "./components/AddEditChargeDialog";
import { ArtworkDialogs } from "./components/ArtworkDialogs";
import { CopyArtworkDialog } from "./components/CopyArtworkDialog";
import { DecoratorMatrixDialogs } from "./components/DecoratorMatrixDialogs";
import { FilePreviewDialog } from "./components/FilePreviewDialog";
import { MarginWarningDialog } from "./components/MarginWarningDialog";
import { PricingTiersDialog } from "./components/PricingTiersDialog";
import { SizesColorsDialog } from "./components/SizesColorsDialog";

/** Inline Color/Size selector popover — CommonSKU style */
function ColorSizePopover({ colors, sizes, selectedColor, selectedSize, onSelect }: {
  colors: string[];
  sizes: string[];
  selectedColor: string;
  selectedSize: string;
  onSelect: (color: string, size: string) => void;
}) {
  const [color, setColor] = useState(selectedColor);
  const [size, setSize] = useState(selectedSize);
  const [search, setSearch] = useState("");

  const filteredColors = colors.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex divide-x max-h-64">
      {colors.length > 0 && (
        <div className="w-40 flex flex-col">
          <div className="p-2 border-b">
            <input
              className="w-full h-7 text-xs rounded border border-gray-200 px-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Find Color"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredColors.map(c => (
              <button
                key={c}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors ${c === color ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => { setColor(c); onSelect(c, size); }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      {sizes.length > 0 && (
        <div className="w-36 flex flex-col">
          <div className="p-2 border-b">
            <span className="text-[10px] font-medium text-gray-500 uppercase">Size</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sizes.map(s => (
              <button
                key={s}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors ${s === size ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => { setSize(s); onSelect(color, s); }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface EditProductPageProps {
  projectId: string;
  itemId: string;
  data: ProjectData;
  open: boolean;
  onClose: () => void;
}


export default function EditProductPage({ projectId, itemId, data, open, onClose }: EditProductPageProps) {
  const editProductPage = useEditProductPage(projectId, itemId, data, onClose);
  const [showMatrixDialog, setShowMatrixDialog] = useState(false);
  const [showPricingTiers, setShowPricingTiers] = useState(false);
  const [matrixPickerTarget, setMatrixPickerTarget] = useState<{
    artworkId: string;
    chargeId: string;
    chargeName: string;
    chargeType: "run" | "fixed";
    artworkMethod?: string;
    currentMargin?: number;
  } | null>(null);

  const { data: taxCodes } = useQuery<any[]>({
    queryKey: ["/api/tax-codes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        {!editProductPage.item ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Product not found</p>
          </div>
        ) : (
          <EditProductPageBody
            editProductPage={editProductPage}
            projectId={projectId}
            itemId={itemId}
            data={data}
            taxCodes={taxCodes}
            showMatrixDialog={showMatrixDialog}
            setShowMatrixDialog={setShowMatrixDialog}
            showPricingTiers={showPricingTiers}
            setShowPricingTiers={setShowPricingTiers}
            matrixPickerTarget={matrixPickerTarget}
            setMatrixPickerTarget={setMatrixPickerTarget}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditProductPageBody({
  editProductPage,
  projectId,
  itemId,
  data,
  taxCodes,
  showMatrixDialog,
  setShowMatrixDialog,
  showPricingTiers,
  setShowPricingTiers,
  matrixPickerTarget,
  setMatrixPickerTarget,
}: {
  editProductPage: ReturnType<typeof useEditProductPage>;
  projectId: string;
  itemId: string;
  data: ProjectData;
  taxCodes: any[] | undefined;
  showMatrixDialog: boolean;
  setShowMatrixDialog: (v: boolean) => void;
  showPricingTiers: boolean;
  setShowPricingTiers: (v: boolean) => void;
  matrixPickerTarget: {
    artworkId: string;
    chargeId: string;
    chargeName: string;
    chargeType: "run" | "fixed";
    artworkMethod?: string;
    currentMargin?: number;
  } | null;
  setMatrixPickerTarget: (v: any) => void;
}) {
  if (!editProductPage.item) return null;
  const itemSupplier = editProductPage.getItemSupplier(editProductPage.item);
  const imageUrl = editProductPage.getProductImage(editProductPage.item);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={editProductPage.goBack}>Cancel</Button>
        <Button onClick={editProductPage.handleSave} disabled={editProductPage.isSaving || !editProductPage.hasChanges}>
          {editProductPage.isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>

      {/* Product Header Card */}
      <Card>
        <CardHeader className="p-5">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Product Details</h2>
          </div>
        </CardHeader>
        <CardContent className="px-5 gap-2 flex flex-col">
          <div className="flex gap-4">
            {imageUrl ? (
              <img src={imageUrl} alt={editProductPage.item.productName} className="w-20 h-20 object-contain rounded-lg border bg-white" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg border flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{editProductPage.item.productName || "Unnamed Product"}</h2>
              <div className="flex items-center gap-2 mt-1">
                {editProductPage.item.productSku && (
                  <Badge variant="outline" className="text-xs">{editProductPage.item.productSku}</Badge>
                )}
                {itemSupplier && (
                  <span className="text-sm text-gray-500">{itemSupplier.name}</span>
                )}
              </div>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={editProductPage.editItemData.description || ""}
              onChange={(e: any) => editProductPage.setEditItemData((d: any) => ({ ...d, description: e.target.value }))}
              placeholder={editProductPage.item.productDescription || "Product description..."}
              rows={2}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={editProductPage.editItemData.notes || ""}
              onChange={(e: any) => editProductPage.setEditItemData((d: any) => ({ ...d, notes: e.target.value }))}
              placeholder="Product-specific notes..."
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-500" />
              Private Notes
              <span className="text-[10px] text-amber-600 font-normal">(team only — hidden from client)</span>
            </Label>
            <Textarea
              value={editProductPage.editItemData.privateNotes || ""}
              onChange={(e: any) => editProductPage.setEditItemData((d: any) => ({ ...d, privateNotes: e.target.value }))}
              placeholder="Internal notes visible only to your team..."
              rows={2}
            />
          </div>
          {/* <div>
            <Label>Tax Code Override</Label>
            <Select
              value={editProductPage.editItemData.taxCodeId || "none"}
              onValueChange={(val) => editProductPage.setEditItemData((d: any) => ({ ...d, taxCodeId: val === "none" ? "" : val }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Use order default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Use order default</SelectItem>
                {(taxCodes || []).map((tc: any) => (
                  <SelectItem key={tc.id} value={String(tc.id)}>
                    {tc.label} {tc.rate ? `(${tc.rate}%)` : ""} {tc.isExempt ? "— Exempt" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Override the order-level tax code for this item only</p>
          </div> */}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 items-center">
              <Ruler className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-lg">Pricing</h3>
            </div>
            <div className="flex items-center gap-2">
              {editProductPage.productCatalog.pricingTiers.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowPricingTiers(true)}>
                  <DollarSign className="w-3 h-3 mr-1" />
                  Check Pricing
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => editProductPage.addLine()}>
                <Plus className="w-3 h-3 mr-1" />
                Add Line
              </Button>
              {(editProductPage.productCatalog.colors.length > 0 || editProductPage.productCatalog.sizes.length > 0) && (
                <Button variant="default" size="sm" onClick={() => editProductPage.setShowSizesColors(true)}>
                  <Grid3X3 className="w-3 h-3 mr-1" />
                  Add Sizes & Colors
                </Button>
              )}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Color/Size</th>
                  <th className="text-right p-3 font-medium w-20">QTY</th>
                  <th className="text-right p-3 font-medium w-28">Net Cost</th>
                  <th className="text-right p-3 font-medium w-24">
                    <span title={`Min: ${editProductPage.marginSettings.minimumMargin}% | Target: ${editProductPage.marginSettings.defaultMargin}%`}>
                      Margin
                    </span>
                  </th>
                  <th className="text-right p-3 font-medium w-28">
                    <button
                      className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                      onClick={() => editProductPage.setIsPriceLocked(!editProductPage.isPriceLocked)}
                      title={editProductPage.isPriceLocked ? "Retail locked — cost changes affect margin only" : "Click to lock retail price"}
                    >
                      Retail
                      {editProductPage.isPriceLocked
                        ? <Lock className="w-3 h-3 text-blue-600" />
                        : <LockOpen className="w-3 h-3 text-gray-400" />}
                    </button>
                  </th>
                  {editProductPage.bakedInChargePerUnit > 0 && (
                    <th className="text-right p-3 font-medium w-24">Client Price</th>
                  )}
                  <th className="text-right p-3 font-medium w-28">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {editProductPage.editableLines.map((line: any) => {
                  const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
                  const lineMargin = line.unitPrice > 0
                    ? ((line.unitPrice - line.cost) / line.unitPrice * 100) : 0;
                  const clientPrice = (line.unitPrice || 0) + editProductPage.bakedInChargePerUnit;
                  const hasColors = editProductPage.productCatalog.colors.length > 0;
                  const hasSizes = editProductPage.productCatalog.sizes.length > 0;
                  const colorSizeLabel = [line.color, line.size].filter(Boolean).join(" / ") || "—";

                  return (
                    <tr key={line.id} className="border-b last:border-0">
                      {/* Color/Size — popover or plain inputs */}
                      <td className="p-2">
                        {(hasColors || hasSizes) ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="h-8 w-full text-left text-xs px-2 rounded border border-gray-200 bg-white hover:bg-gray-50 truncate flex items-center justify-between gap-1">
                                <span className={colorSizeLabel === "—" ? "text-gray-400" : ""}>{colorSizeLabel}</span>
                                <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                              <ColorSizePopover
                                colors={editProductPage.productCatalog.colors}
                                sizes={editProductPage.productCatalog.sizes}
                                selectedColor={line.color}
                                selectedSize={line.size}
                                onSelect={(color, size) => {
                                  editProductPage.updateLine(line.id, "color", color);
                                  editProductPage.updateLine(line.id, "size", size);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <div className="flex gap-1">
                            <Input className="h-8 text-xs flex-1" value={line.color} onChange={(e) => editProductPage.updateLine(line.id, "color", e.target.value)} placeholder="Color" />
                            <Input className="h-8 text-xs w-20" value={line.size} onChange={(e) => editProductPage.updateLine(line.id, "size", e.target.value)} placeholder="Size" />
                          </div>
                        )}
                      </td>
                      {/* QTY */}
                      <td className="p-2">
                        <PricingInput
                          className="flex h-8 w-full text-xs text-right rounded-md border border-input bg-background px-3 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          step="1"
                          min={0}
                          value={line.quantity}
                          onCommit={(n) => editProductPage.updateLine(line.id, "quantity", Math.round(n))}
                        />
                      </td>
                      {/* Net Cost */}
                      <td className="p-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                          <PricingInput
                            className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                            step="0.01"
                            min={0}
                            value={line.cost}
                            onCommit={(n) => editProductPage.handleCostChange(line.id, { target: { value: String(n) } } as React.ChangeEvent<HTMLInputElement>)}
                          />
                        </div>
                      </td>
                      {/* Margin */}
                      <td className="p-2">
                        <div className="relative">
                          <PricingInput
                            className={`w-full h-8 text-xs text-right rounded border bg-white px-2 pr-5 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 ${isBelowMinimum(lineMargin, editProductPage.marginSettings) ? "border-red-300 text-red-600" : "border-gray-200"}`}
                            step="0.1"
                            min={0}
                            max={99.9}
                            value={parseFloat(lineMargin.toFixed(1))}
                            onCommit={(n) => editProductPage.handleMarginChange(line.id, { target: { value: String(n) } } as React.ChangeEvent<HTMLInputElement>)}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                        </div>
                      </td>
                      {/* Retail */}
                      <td className="p-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                          <PricingInput
                            className={`w-full h-8 text-xs text-right rounded border bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 font-semibold ${editProductPage.isPriceLocked ? "border-blue-300 bg-blue-50/30" : "border-gray-200"}`}
                            step="0.01"
                            min={0}
                            value={line.unitPrice}
                            onCommit={(n) => editProductPage.updateLine(line.id, "unitPrice", n)}
                          />
                        </div>
                      </td>
                      {/* Client Price */}
                      {editProductPage.bakedInChargePerUnit > 0 && (
                        <td className="p-2 text-right">
                          <span className="text-xs text-gray-600">${clientPrice.toFixed(2)}</span>
                        </td>
                      )}
                      {/* Total */}
                      <td className="p-2 text-right">
                        <span className="text-xs font-semibold">${lineTotal.toFixed(2)}</span>
                      </td>
                      {/* Delete */}
                      <td className="p-2">
                        {editProductPage.editableLines.length > 1 && (
                          <button className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                            onClick={() => editProductPage.removeLine(line.id)}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td className="p-3 text-sm font-semibold">Totals</td>
                  <td className="p-3 text-right text-sm font-semibold">{editProductPage.lineTotals.qty}</td>
                  <td className="p-3 text-right text-sm text-gray-500">${editProductPage.lineTotals.cost.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <span className={`text-sm font-semibold ${editProductPage.marginColor(editProductPage.margin)}`}>
                      {editProductPage.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right text-sm font-semibold">${editProductPage.lineTotals.revenue.toFixed(2)}</td>
                  {editProductPage.bakedInChargePerUnit > 0 && <td className="p-3"></td>}
                  <td className="p-3 text-right text-sm font-bold">${editProductPage.lineTotals.revenue.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Margin Summary Bar with Gauge */}
          {editProductPage.lineTotals.qty > 0 && (() => {
            const currentMargin = editProductPage.margin;
            const minMargin = editProductPage.marginSettings.minimumMargin;
            const defaultMargin = editProductPage.marginSettings.defaultMargin;
            const profit = editProductPage.lineTotals.revenue - editProductPage.lineTotals.cost;
            const belowMin = isBelowMinimum(currentMargin, editProductPage.marginSettings);

            // Gauge calculation: 0-70% of bar width represents 0-maxScale% margin
            const maxScale = Math.max(defaultMargin + 15, currentMargin + 10);
            const pct = (v: number) => Math.min(100, Math.max(0, (v / maxScale) * 100));

            return (
              <div className={`rounded-lg border mt-4 overflow-hidden ${belowMin ? "border-red-200" : "border-gray-200"}`}>
                {/* Stats row */}
                <div className={`px-4 py-3 flex items-center justify-between text-sm ${editProductPage.marginBg(currentMargin)}`}>
                  <div className="flex items-center gap-5">
                    <span className="text-gray-600">
                      Qty: <strong>{editProductPage.lineTotals.qty}</strong>
                    </span>
                    <span className="text-gray-600">
                      Cost: <strong>${editProductPage.lineTotals.cost.toFixed(2)}</strong>
                    </span>
                    <span className="text-gray-600">
                      Margin: <strong className={`text-base ${editProductPage.marginColor(currentMargin)}`}>{currentMargin.toFixed(1)}%</strong>
                    </span>
                    <span className="text-gray-600">
                      Profit: <strong className={profit >= 0 ? "text-green-700" : "text-red-600"}>${profit.toFixed(2)}</strong>
                    </span>
                  </div>
                  <span className="font-bold text-blue-600 text-base">${editProductPage.lineTotals.revenue.toFixed(2)}</span>
                </div>

                {/* Margin gauge */}
                <div className="px-4 py-2 bg-white">
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    {/* Red zone: 0 to minimum */}
                    <div
                      className="absolute inset-y-0 left-0 bg-red-200"
                      style={{ width: `${pct(minMargin)}%` }}
                    />
                    {/* Yellow zone: minimum to default */}
                    <div
                      className="absolute inset-y-0 bg-yellow-200"
                      style={{ left: `${pct(minMargin)}%`, width: `${pct(defaultMargin) - pct(minMargin)}%` }}
                    />
                    {/* Green zone: default+ */}
                    <div
                      className="absolute inset-y-0 bg-green-200 rounded-r-full"
                      style={{ left: `${pct(defaultMargin)}%`, right: 0 }}
                    />
                    {/* Current margin indicator */}
                    <div
                      className={`absolute top-0 bottom-0 w-1 rounded-full ${belowMin ? "bg-red-600" : currentMargin >= defaultMargin ? "bg-green-600" : "bg-yellow-600"}`}
                      style={{ left: `${pct(currentMargin)}%`, transform: "translateX(-50%)" }}
                    />
                  </div>
                  {/* Labels */}
                  <div className="relative h-4 mt-0.5 text-[9px] text-gray-500">
                    <span className="absolute text-red-500 font-medium" style={{ left: `${pct(minMargin)}%`, transform: "translateX(-50%)" }}>
                      Min {minMargin}%
                    </span>
                    {defaultMargin !== minMargin && (
                      <span className="absolute text-green-600 font-medium" style={{ left: `${pct(defaultMargin)}%`, transform: "translateX(-50%)" }}>
                        Target {defaultMargin}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Below minimum action bar */}
                {belowMin && (
                  <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Margin ({currentMargin.toFixed(1)}%) is below the company minimum of {minMargin}%.
                        Saving will require confirmation.
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-100 flex-shrink-0"
                      onClick={() => editProductPage.applyMarginToAllLines(defaultMargin)}
                    >
                      Apply {defaultMargin}% to All
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Run Charges + Fixed Charges */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-gray-400" />
              Charges
            </h3>
            <Button variant="outline" size="sm" onClick={() => editProductPage.setShowAddCharge(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Add Charge
            </Button>
          </div>

          {(() => {
            const runCharges = editProductPage.charges.filter((c: any) => c.chargeCategory === "run");
            const fixedCharges = editProductPage.charges.filter((c: any) => c.chargeCategory !== "run");

            if (editProductPage.charges.length === 0) {
              return <p className="text-xs text-gray-400">No charges added</p>;
            }

            const renderCharge = (charge: any) => {
              const cNetCost = parseFloat(charge.netCost || "0");
              const cRetail = parseFloat(charge.retailPrice || charge.amount || "0");
              const cMargin = parseFloat(charge.margin || "0");
              const cQty = charge.chargeCategory === "run" ? (editProductPage.lineTotals.qty || 1) : (charge.quantity || 1);
              return (
              <div key={charge.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{charge.description}</span>
                  {charge.includeInUnitPrice && (
                    <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600 shrink-0">
                      {charge.chargeCategory === "run" ? "in price" : "in margin"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {cNetCost > 0 && (
                    <span className="text-xs text-gray-400">Cost: ${cNetCost.toFixed(2)}</span>
                  )}
                  {cMargin > 0 && (
                    <span className={`text-xs ${cMargin >= 40 ? "text-green-600" : cMargin >= 30 ? "text-yellow-600" : "text-red-600"}`}>{cMargin.toFixed(1)}%</span>
                  )}
                  <span className={`font-semibold ${charge.includeInUnitPrice ? "text-gray-400 line-through" : ""}`}>
                    ${cRetail.toFixed(2)}{cQty > 1 ? ` x${cQty}` : ""}
                  </span>
                  <Button
                    variant="ghost" size="sm" className="h-6 w-6 p-0"
                    title="Edit charge"
                    onClick={() => {
                      editProductPage.setEditingCharge(charge);
                      editProductPage.setNewCharge({
                        description: charge.description,
                        chargeType: charge.chargeType || "flat",
                        chargeCategory: charge.chargeCategory || "fixed",
                        amount: parseFloat(charge.amount || "0"),
                        netCost: parseFloat(charge.netCost || "0"),
                        retailPrice: parseFloat(charge.retailPrice || charge.amount || "0"),
                        margin: parseFloat(charge.margin || "0"),
                        quantity: charge.quantity || 1,
                        isVendorCharge: charge.isVendorCharge || false,
                        displayToClient: charge.displayToClient !== false,
                        displayToVendor: charge.displayToVendor !== false,
                        includeInUnitPrice: charge.includeInUnitPrice || false,
                      });
                      editProductPage.setShowAddCharge(true);
                    }}
                  >
                    <Pencil className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="h-6 w-6 p-0"
                    title={charge.displayToClient !== false ? "Visible to client" : "Hidden from client"}
                    onClick={() => editProductPage.toggleChargeDisplayMutation.mutate({
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
                    onClick={() => editProductPage.deleteChargeMutation.mutate({ chargeId: charge.id, orderItemId: charge.orderItemId })}
                  >
                    <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            );
            };

            return (
              <div className="space-y-4">
                {runCharges.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Run Charges (per unit)</h4>
                    <div className="space-y-1.5">{runCharges.map(renderCharge)}</div>
                  </div>
                )}
                {fixedCharges.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fixed Charges (one-time)</h4>
                    <div className="space-y-1.5">{fixedCharges.map(renderCharge)}</div>
                  </div>
                )}
                <div className="text-right text-xs text-gray-500 pt-1">
                  Total Charges: <strong className="text-gray-800">${editProductPage.totalCharges.toFixed(2)}</strong>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Artwork */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-end justify-between mb-4">
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-lg flex items-center gap-1.5">
                <Image className="w-4 h-4 text-gray-400" />
                Decorations {editProductPage.artworks.length > 0 && `(${editProductPage.artworks.length})`}
              </h3>
              {/* Decorator Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-gray-400" />
                    Decorator Type
                  </Label>
                  <Select
                    value={editProductPage.editItemData.decoratorType || "supplier"}
                    onValueChange={(v) => editProductPage.setEditItemData((d: any) => ({
                      ...d,
                      decoratorType: v,
                      decoratorId: v === "supplier" ? "" : d.decoratorId,
                      // Auto-suggest shipping destination
                      shippingDestination: v === "third_party" ? "decorator" : (d.shippingDestination === "decorator" ? "" : d.shippingDestination),
                    }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Supplier Decorator</SelectItem>
                      <SelectItem value="third_party">Third-Party Decorator</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-gray-400 flex-1">
                      {editProductPage.editItemData.decoratorType === "third_party"
                        ? "Blank goods ship to separate decorator for imprinting"
                        : "Supplier provides both blank goods and decoration"}
                    </p>
                    {editProductPage.editItemData.decoratorType === "third_party" && (
                      <Button
                        type="button" variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-blue-600"
                        onClick={() => setShowMatrixDialog(true)}
                      >
                        <Grid3X3 className="w-3 h-3" /> Matrix
                      </Button>
                    )}
                  </div>
                </div>
                {editProductPage.editItemData.decoratorType === "third_party" && (
                  <div>
                    <Label>Third-Party Decorator</Label>
                    <Select
                      value={editProductPage.editItemData.decoratorId || ""}
                      onValueChange={(v) => editProductPage.setEditItemData((d: any) => ({ ...d, decoratorId: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select decorator..." /></SelectTrigger>
                      <SelectContent>
                        {editProductPage.suppliers
                          .filter((s: any) => s.isDecorator && s.id !== editProductPage.item?.supplierId)
                          .map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        {editProductPage.suppliers.filter((s: any) => s.isDecorator && s.id !== editProductPage.item?.supplierId).length === 0 && (
                          <div className="px-3 py-2 text-xs text-muted-foreground">
                            No vendors marked as decorator. Go to Settings → Vendors to mark vendors as decorators.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => editProductPage.setPickingArtwork(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Decoration Location
            </Button>
          </div>

          {editProductPage.artworks.length > 0 ? (
            <div className="space-y-3">
              {editProductPage.artworks.map((art: any) => {
                const artCharges = editProductPage.allArtworkCharges[art.id] || [];
                const artFiles = editProductPage.allArtworkFiles[art.id] || [];
                const runCharges = artCharges.filter((c: any) => c.chargeCategory === "run");
                const fixedCharges = artCharges.filter((c: any) => c.chargeCategory !== "run");
                const vendorId = editProductPage.editItemData.decoratorType === "third_party"
                  ? editProductPage.editItemData.decoratorId
                  : editProductPage.item?.supplierId;

                // Build file list: artworkItemFiles if any, fallback to artworkItems.filePath
                const displayFiles = artFiles.length > 0
                  ? artFiles
                  : art.filePath ? [{ id: "primary", filePath: art.filePath, fileName: art.fileName }] : [];

                return (
                  <div key={art.id} className="border rounded-lg bg-white overflow-hidden">
                    {/* Artwork header row */}
                    <div className="p-3 flex gap-3 items-start">
                      {/* Thumbnails */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        {displayFiles.length > 0 ? displayFiles.slice(0, 3).map((f: any, idx: number) => (
                          <div key={f.id || idx}
                            className={`w-14 h-14 bg-gray-50 rounded border overflow-hidden flex items-center justify-center relative ${f.filePath ? "cursor-pointer hover:ring-2 hover:ring-blue-300 transition-shadow" : ""}`}
                            onClick={() => f.filePath && editProductPage.setPreviewFile({ name: f.fileName || art.name || "Artwork", url: f.filePath })}
                          >
                            {(() => {
                              const ext = (f.filePath || "").split("?")[0].split(".").pop()?.toLowerCase();
                              const isDesign = ["ai", "eps", "psd"].includes(ext || "");
                              const src = isDesign && (f.filePath || "").includes("cloudinary.com")
                                ? getCloudinaryThumbnail(f.filePath, 112, 112)
                                : f.filePath;
                              return <img src={src} alt={f.fileName} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
                            })()}
                            {f.id !== "primary" && (
                              <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] opacity-0 hover:opacity-100 transition-opacity"
                                onClick={() => editProductPage.removeArtworkFileMutation.mutate({ artworkId: art.id, fileId: f.id })}>×</button>
                            )}
                          </div>
                        )) : (
                          <div className="w-14 h-14 bg-gray-50 rounded border flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        {displayFiles.length > 3 && (
                          <div className="w-14 h-14 bg-gray-100 rounded border flex items-center justify-center text-[10px] text-gray-500 font-medium">
                            +{displayFiles.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${art.filePath ? "cursor-pointer hover:text-blue-600 hover:underline" : ""}`}
                          onClick={() => art.filePath && editProductPage.setPreviewFile({ name: art.name || art.fileName || "Artwork", url: art.filePath })}
                        >{art.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {art.location && <span className="text-[10px] text-gray-500">{formatLabel(art.location)}</span>}
                          {art.artworkType && <span className="text-[10px] text-gray-400">· {formatLabel(art.artworkType)}</span>}
                          {art.size && <span className="text-[10px] text-gray-400">· {formatLabel(art.size)}</span>}
                          {art.repeatLogo && (
                            <Badge variant="outline" className="text-[9px] border-purple-200 text-purple-600">
                              <Repeat className="w-2.5 h-2.5 mr-0.5" /> repeat
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${art.status === "approved" ? "border-green-300 text-green-700" :
                              art.status === "rejected" ? "border-red-300 text-red-700" :
                                "border-yellow-300 text-yellow-700"
                              }`}
                          >
                            {formatLabel(art.status)}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={() => editProductPage.deleteArtworkMutation.mutate({ artworkId: art.id, orderItemId: itemId })}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    {/* CommonSKU-style inline charge rows */}
                    <div className="border-t">
                      {/* Column headers */}
                      <div className="grid grid-cols-[20px_1fr_50px_80px_65px_80px_130px_28px] gap-0 items-center px-3 py-1 bg-gray-50 border-b text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                        <span></span>
                        <span>Charge</span>
                        <span className="text-center">Qty</span>
                        <span className="text-right">Cost</span>
                        <span className="text-right">Margin %</span>
                        <span className="text-right">Sell</span>
                        <span></span>
                        <span></span>
                      </div>

                      {/* Charge rows — inline editable */}
                      {artCharges.map((charge: any) => {
                        const isRun = charge.chargeCategory === "run";
                        const cNetCost = parseFloat(charge.netCost || "0");
                        const cMargin = parseFloat(charge.margin || "0");
                        return (
                          <div key={`${charge.id}-${charge.updatedAt || ''}`} className="grid grid-cols-[20px_1fr_50px_80px_65px_80px_130px_28px] gap-0 items-center px-3 py-1 border-b last:border-0 hover:bg-gray-50/50">
                            {/* Matrix icon */}
                            {editProductPage.editItemData.decoratorType === "third_party" ? (
                              <button
                                className="w-4 h-4 flex items-center justify-center text-blue-400 hover:text-blue-600"
                                title="Select pricing from decorator matrix"
                                onClick={() => setMatrixPickerTarget({
                                  artworkId: art.id,
                                  chargeId: charge.id,
                                  chargeName: charge.chargeName || (isRun ? "Imprint Cost" : "Setup Cost"),
                                  chargeType: isRun ? "run" : "fixed",
                                  artworkMethod: art.artworkType,
                                  currentMargin: cMargin,
                                })}
                              >
                                <Grid3X3 className="w-3 h-3" />
                              </button>
                            ) : <span />}
                            {/* Charge Name — editable */}
                            <input
                              className="text-xs font-medium bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5 w-full"
                              defaultValue={formatLabel(charge.chargeName)}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val && val !== charge.chargeName) {
                                  editProductPage.updateArtworkChargeMutation.mutate({
                                    artworkId: art.id, chargeId: charge.id,
                                    updates: { chargeName: val },
                                  });
                                }
                              }}
                            />
                            {/* Qty */}
                            <input
                              type="number"
                              className="text-xs text-center bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              defaultValue={isRun ? (editProductPage.lineTotals.qty || 1) : (charge.quantity || 1)}
                              readOnly={isRun}
                              onBlur={(e) => {
                                if (isRun) return;
                                const val = parseInt(e.target.value) || 1;
                                if (val !== charge.quantity) {
                                  editProductPage.updateArtworkChargeMutation.mutate({
                                    artworkId: art.id, chargeId: charge.id,
                                    updates: { quantity: val },
                                  });
                                }
                              }}
                            />
                            {/* $ Cost */}
                            <input
                              type="number"
                              step="0.01"
                              className="text-xs text-right bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              defaultValue={cNetCost.toFixed(2)}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (Math.abs(val - cNetCost) > 0.001) {
                                  const m = cMargin;
                                  const retail = m > 0 && m < 100 ? val / (1 - m / 100) : val;
                                  editProductPage.updateArtworkChargeMutation.mutate({
                                    artworkId: art.id, chargeId: charge.id,
                                    updates: { netCost: val.toFixed(2), retailPrice: retail.toFixed(2) },
                                  });
                                }
                              }}
                            />
                            {/* Margin % */}
                            <input
                              type="number"
                              step="0.1"
                              className="text-xs text-right bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              defaultValue={cMargin.toFixed(2)}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (Math.abs(val - cMargin) > 0.1) {
                                  const retail = val > 0 && val < 100 ? cNetCost / (1 - val / 100) : cNetCost;
                                  editProductPage.updateArtworkChargeMutation.mutate({
                                    artworkId: art.id, chargeId: charge.id,
                                    updates: { margin: val.toFixed(2), retailPrice: retail.toFixed(2) },
                                  });
                                }
                              }}
                            />
                            {/* Sell — calculated from cost + margin (read-only) */}
                            <span className="text-xs text-right text-gray-600 px-1 py-0.5 tabular-nums">
                              {(cMargin > 0 && cMargin < 100 ? cNetCost / (1 - cMargin / 100) : cNetCost).toFixed(2)}
                            </span>
                            {/* Display mode */}
                            <Select
                              defaultValue={charge.displayMode || "display_to_client"}
                              onValueChange={(v) => {
                                editProductPage.updateArtworkChargeMutation.mutate({
                                  artworkId: art.id, chargeId: charge.id,
                                  updates: { displayMode: v },
                                });
                              }}
                            >
                              <SelectTrigger className="h-6 text-[10px] border-0 shadow-none px-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {isRun ? (
                                  <>
                                    <SelectItem value="include_in_price">Include in price</SelectItem>
                                    <SelectItem value="display_to_client">Display to client</SelectItem>
                                  </>
                                ) : (
                                  <>
                                    <SelectItem value="display_to_client">Display to client</SelectItem>
                                    <SelectItem value="subtract_from_margin">Subtract from margin</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            {/* Delete */}
                            <button
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                              onClick={() => editProductPage.deleteArtworkChargeMutation.mutate({ artworkId: art.id, chargeId: charge.id })}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Quick add links — CommonSKU style */}
                      <div className="flex items-center gap-4 px-3 py-1.5 text-[10px]">
                        <button
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={() => {
                            editProductPage.createArtworkChargeMutation.mutate({
                              artworkId: art.id,
                              charge: {
                                chargeName: `${art.artworkType || "Imprint"} run charge`,
                                chargeCategory: "run",
                                netCost: "0", margin: "0", retailPrice: "0",
                                quantity: 1,
                                displayMode: "include_in_price",
                              },
                            });
                          }}
                        >
                          + Run charge
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={() => {
                            editProductPage.createArtworkChargeMutation.mutate({
                              artworkId: art.id,
                              charge: {
                                chargeName: `${art.artworkType || "Setup"} fixed charge`,
                                chargeCategory: "fixed",
                                netCost: "0", margin: "0", retailPrice: "0",
                                quantity: 1,
                                displayMode: "display_to_client",
                              },
                            });
                          }}
                        >
                          + Fixed charge
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-800 hover:underline ml-auto"
                          onClick={() => editProductPage.setCopyingArtworkId(art.id)}
                        >
                          + Copy item location
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No decorations yet — click "+ Decoration Location" to add imprint locations (front, back, sleeve, etc.)</p>
          )}
        </CardContent>
      </Card>

      {/* Unified Summary — CommonSKU style: Margin (left) + Subtotal/Tax/Total (right) */}
      {(() => {
        // ── Pricing breakdown (3 layers: Product → Charges → Decoration) ──

        // Layer 1: Product (lines) — already calculated in hook
        const productSellTotal = editProductPage.productSubtotal.productSellTotal;
        const productCostTotal = editProductPage.productSubtotal.productCostTotal;
        const itemTotalQty = editProductPage.productSubtotal.totalQty;

        // Layer 2: Charges (setup fees, etc.) — already calculated in hook
        const chargeSellTotal = editProductPage.chargeSubtotal.chargeSellTotal;
        const chargeCostTotal = editProductPage.chargeSubtotal.chargeCostTotal;

        // Layer 3: Decoration (artwork imprint charges) — collect from all artworks
        const decoCharges: any[] = [];
        editProductPage.artworks.forEach((art: any) => {
          const charges = editProductPage.allArtworkCharges[art.id] || [];
          charges.forEach((c: any) => decoCharges.push(c));
        });
        const decoSub = getDecorationSubtotal(decoCharges, itemTotalQty);
        const decoSellTotal = decoSub.decoSellTotal;
        const decoCostTotal = decoSub.decoCostTotal;

        // ── Combined totals ──
        const productPlusCharges = productSellTotal + chargeSellTotal;
        const itemSellGrandTotal = productPlusCharges + decoSellTotal;     // pre-tax client total
        const itemCostGrandTotal = productCostTotal + chargeCostTotal + decoCostTotal;
        const itemProfitTotal = itemSellGrandTotal - itemCostGrandTotal;
        const itemMarginPercent = calcMarginPercent(itemSellGrandTotal, itemCostGrandTotal);

        // ── Tax (applied to entire pre-tax total: product + charges + deco) ──
        // Falls back to order-level defaultTaxCodeId when item has no override
        const effectiveTaxCodeId = editProductPage.editItemData.taxCodeId || (data.order as any)?.defaultTaxCodeId;
        const currentTaxCode = effectiveTaxCodeId
          ? (taxCodes || []).find((tc: any) => tc.id === effectiveTaxCodeId)
          : null;
        const taxRate = currentTaxCode ? parseFloat(currentTaxCode.rate || "0") : 0;
        const taxAmount = itemSellGrandTotal * (taxRate / 100);

        // ── Final total ──
        const grandTotalWithTax = itemSellGrandTotal + taxAmount;

        // ── Decoration-only margin (for the breakdown display) ──
        const decoMarginPercent = calcMarginPercent(decoSellTotal, decoCostTotal);

        return (
          <div className="flex justify-between items-start gap-4 bg-primary p-4 rounded-lg">
            {/* Left: Margin summary with full breakdown */}
            <div className="bg-white rounded-lg border p-4 space-y-1.5 w-80">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overall Margin</span>
                <span className={`font-bold ${itemMarginPercent >= 40 ? "text-green-600" : itemMarginPercent >= 30 ? "text-yellow-600" : "text-red-600"}`}>
                  {itemMarginPercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profit</span>
                <span className={`font-semibold ${itemProfitTotal < 0 ? "text-red-600" : ""}`}>${itemProfitTotal.toFixed(2)}</span>
              </div>

              {/* Detailed breakdown */}
              <div className="border-t pt-2 mt-2 space-y-1.5">
                {/* Product layer */}
                <div>
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span className="font-medium">Product</span>
                    <span className={`font-semibold ${editProductPage.margin >= 30 ? "text-green-600" : editProductPage.margin >= 0 ? "text-yellow-600" : "text-red-600"}`}>
                      {editProductPage.margin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 pl-2">
                    <span>cost ${productCostTotal.toFixed(2)} → sell ${productSellTotal.toFixed(2)}</span>
                    <span>${(productSellTotal - productCostTotal).toFixed(2)}</span>
                  </div>
                </div>

                {/* Charges layer */}
                {(chargeSellTotal > 0 || chargeCostTotal > 0) && (
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-600">
                      <span className="font-medium">Charges</span>
                      <span className={`font-semibold ${calcMarginPercent(chargeSellTotal, chargeCostTotal) >= 30 ? "text-green-600" : calcMarginPercent(chargeSellTotal, chargeCostTotal) >= 0 ? "text-yellow-600" : "text-red-600"}`}>
                        {calcMarginPercent(chargeSellTotal, chargeCostTotal).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 pl-2">
                      <span>cost ${chargeCostTotal.toFixed(2)} → sell ${chargeSellTotal.toFixed(2)}</span>
                      <span>${(chargeSellTotal - chargeCostTotal).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Decoration layer */}
                {(decoSellTotal > 0 || decoCostTotal > 0) && (
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-600">
                      <span className="font-medium">Decoration</span>
                      <span className={`font-semibold ${decoMarginPercent >= 30 ? "text-green-600" : decoMarginPercent >= 0 ? "text-yellow-600" : "text-red-600"}`}>
                        {decoMarginPercent.toFixed(1)}%
                        {decoMarginPercent < 0 && <span className="ml-1" title="Decoration cost exceeds sell price">⚠</span>}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 pl-2">
                      <span>cost ${decoCostTotal.toFixed(2)} → sell ${decoSellTotal.toFixed(2)}</span>
                      <span className={decoSellTotal - decoCostTotal < 0 ? "text-red-500" : ""}>
                        ${(decoSellTotal - decoCostTotal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Total row */}
                <div className="border-t pt-1.5 mt-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                    <span>Total</span>
                    <span>${itemSellGrandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 pl-2">
                    <span>cost ${itemCostGrandTotal.toFixed(2)}</span>
                    <span>profit ${itemProfitTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Warning if deco is selling at loss */}
              {decoMarginPercent < 0 && decoSellTotal > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200 text-[10px] text-red-700 bg-red-50 -mx-4 -mb-4 px-4 py-2 rounded-b-lg">
                  ⚠ Decoration is selling at a loss. Cost (${decoCostTotal.toFixed(2)}) exceeds sell price (${decoSellTotal.toFixed(2)}). Check your matrix pricing or update retail prices.
                </div>
              )}
            </div>

            {/* Right: Subtotal / Tax / Total */}
            <div className="bg-gray-50 rounded-lg border p-4 space-y-2 w-72">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${productPlusCharges.toFixed(2)}</span>
              </div>
              {decoSellTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Decoration</span>
                  <span className="font-medium">${decoSellTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Tax</span>
                  <Select
                    value={editProductPage.editItemData.taxCodeId || "inherit"}
                    onValueChange={(val) => editProductPage.setEditItemData((d: any) => ({ ...d, taxCodeId: val === "inherit" ? "" : val }))}
                  >
                    <SelectTrigger className="h-7 w-[160px] text-xs">
                      <SelectValue placeholder="Select tax" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">
                        {(() => {
                          const orderTc = (data.order as any)?.defaultTaxCodeId
                            ? (taxCodes || []).find((tc: any) => tc.id === (data.order as any).defaultTaxCodeId)
                            : null;
                          return orderTc ? `Order default (${parseFloat(orderTc.rate)}%)` : "No tax";
                        })()}
                      </SelectItem>
                      {(taxCodes || []).map((tc: any) => (
                        <SelectItem key={tc.id} value={tc.id}>
                          {tc.label} ({parseFloat(tc.rate)}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm font-bold">
                <span>Total</span>
                <span>${grandTotalWithTax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bottom save bar */}
      <div className="flex items-center justify-end gap-2 pb-8">
        <Button variant="outline" onClick={editProductPage.goBack}>Cancel</Button>
        <Button onClick={editProductPage.handleSave} disabled={editProductPage.isSaving || !editProductPage.hasChanges}>
          {editProductPage.isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>

      {/* CHARGE DIALOG */}
      <AddEditChargeDialog
        open={editProductPage.showAddCharge}
        editingCharge={editProductPage.editingCharge}
        newCharge={editProductPage.newCharge}
        setNewCharge={editProductPage.setNewCharge}
        itemId={itemId}
        addChargeMutation={editProductPage.addChargeMutation}
        updateChargeMutation={editProductPage.updateChargeMutation}
        onClose={() => { editProductPage.setShowAddCharge(false); editProductPage.setEditingCharge(null); }}
      />

      {/* ARTWORK DIALOGS (file picker + metadata + add file) */}
      <ArtworkDialogs
        projectId={projectId}
        pickingArtwork={editProductPage.pickingArtwork}
        setPickingArtwork={editProductPage.setPickingArtwork}
        handleArtworkFilePicked={editProductPage.handleArtworkFilePicked}
        artPickedFile={editProductPage.artPickedFile}
        artUploadName={editProductPage.artUploadName}
        setArtUploadName={editProductPage.setArtUploadName}
        artUploadLocation={editProductPage.artUploadLocation}
        setArtUploadLocation={editProductPage.setArtUploadLocation}
        artUploadMethod={editProductPage.artUploadMethod}
        setArtUploadMethod={editProductPage.setArtUploadMethod}
        artUploadSize={editProductPage.artUploadSize}
        setArtUploadSize={editProductPage.setArtUploadSize}
        artUploadColor={editProductPage.artUploadColor}
        setArtUploadColor={editProductPage.setArtUploadColor}
        artUploadNumberOfColors={editProductPage.artUploadNumberOfColors}
        setArtUploadNumberOfColors={editProductPage.setArtUploadNumberOfColors}
        artUploadRepeatLogo={editProductPage.artUploadRepeatLogo}
        setArtUploadRepeatLogo={editProductPage.setArtUploadRepeatLogo}
        createArtworkMutation={editProductPage.createArtworkMutation}
        handleCreateArtwork={editProductPage.handleCreateArtwork}
        resetArtForm={editProductPage.resetArtForm}
        addingFileToArtworkId={editProductPage.addingFileToArtworkId}
        setAddingFileToArtworkId={editProductPage.setAddingFileToArtworkId}
        addArtworkFileMutation={editProductPage.addArtworkFileMutation}
      />

      {/* COPY ARTWORK DIALOG */}
      <CopyArtworkDialog
        copyingArtworkId={editProductPage.copyingArtworkId}
        onClose={() => editProductPage.setCopyingArtworkId(null)}
        currentItemId={itemId}
        orderItems={editProductPage.orderItems}
        copyArtworkMutation={editProductPage.copyArtworkMutation}
      />

      {/* MARGIN WARNING DIALOG */}
      <MarginWarningDialog
        open={!!editProductPage.marginWarningAction}
        marginWarningValue={editProductPage.marginWarningValue}
        minimumMargin={editProductPage.marginSettings.minimumMargin}
        onDismiss={editProductPage.dismissMarginWarning}
        onConfirm={editProductPage.confirmMarginWarning}
      />

      {/* DECORATOR MATRIX + CHARGE PICKER DIALOGS */}
      <DecoratorMatrixDialogs
        showMatrixDialog={showMatrixDialog}
        setShowMatrixDialog={setShowMatrixDialog}
        matrixPickerTarget={matrixPickerTarget}
        setMatrixPickerTarget={setMatrixPickerTarget}
        vendorId={
          editProductPage.editItemData.decoratorType === "third_party"
            ? editProductPage.editItemData.decoratorId
            : editProductPage.item?.supplierId
        }
        vendorName={
          editProductPage.editItemData.decoratorType === "third_party"
            ? editProductPage.suppliers.find((s: any) => s.id === editProductPage.editItemData.decoratorId)?.name || "Decorator"
            : itemSupplier?.name || "Supplier"
        }
        artworks={editProductPage.artworks}
        quantity={editProductPage.lineTotals.qty}
        projectId={editProductPage.projectId}
      />

      {/* SIZES & COLORS DIALOG */}
      {editProductPage.showSizesColors && (
        <SizesColorsDialog
          open={editProductPage.showSizesColors}
          onClose={() => editProductPage.setShowSizesColors(false)}
          colors={editProductPage.productCatalog.colors}
          sizes={editProductPage.productCatalog.sizes}
          onDone={(entries) => {
            const defaultCost = editProductPage.editableLines[0]?.cost || 0;
            const defaultPrice = editProductPage.editableLines[0]?.unitPrice || 0;
            entries.forEach(({ color, size, quantity }) => {
              editProductPage.addLine({ color, size, quantity, cost: defaultCost, unitPrice: defaultPrice });
            });
            editProductPage.setShowSizesColors(false);
          }}
        />
      )}

      {/* PRICING TIERS DIALOG */}
      <PricingTiersDialog
        open={showPricingTiers}
        onClose={() => setShowPricingTiers(false)}
        productName={editProductPage.item?.productName}
        pricingTiers={editProductPage.productCatalog.pricingTiers}
        defaultMargin={parseFloat(String(editProductPage.marginSettings?.defaultMargin || "40"))}
        totalQuantity={editProductPage.lineTotals.qty}
        runChargeCostPerUnit={editProductPage.runChargeCostPerUnit}
        sizeSurcharges={editProductPage.productCatalog.sizeSurcharges || []}
        availableSizes={editProductPage.productCatalog.sizes || []}
        onApplyTier={editProductPage.applyTierToLines}
      />

      {/* FILE PREVIEW DIALOG */}
      <FilePreviewDialog
        previewFile={editProductPage.previewFile}
        onClose={() => editProductPage.setPreviewFile(null)}
      />
    </div>
  );
}

// Local-state numeric input — commits to parent on blur/Enter so typing decimals
// doesn't fight with derived re-renders (e.g. cost→price auto-recalc).
function PricingInput({
  value,
  onCommit,
  className,
  step = "0.01",
  min = 0,
  max,
}: {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
  step?: string;
  min?: number;
  max?: number;
}) {
  const [draft, setDraft] = useState<string>(String(value ?? 0));
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(String(value ?? 0));
    }
  }, [value]);

  return (
    <input
      className={className}
      type="number"
      step={step}
      min={min}
      max={max}
      value={draft}
      onFocus={() => { isFocusedRef.current = true; }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        isFocusedRef.current = false;
        const parsed = parseFloat(draft);
        const next = isNaN(parsed) ? 0 : parsed;
        if (next !== value) onCommit(next);
        else setDraft(String(value ?? 0));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}
