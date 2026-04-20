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
  GripVertical,
  Save,
  Trash2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot } from "react-beautiful-dnd";
import { ColorSizePopover } from "@/components/shared/ColorSizePopover";
import { useEditProductPage } from "./hooks";
import { AddEditChargeDialog } from "./components/AddEditChargeDialog";
import { ArtworkDialogs } from "./components/ArtworkDialogs";
import { EditArtworkDialog } from "./components/EditArtworkDialog";
import { CopyArtworkDialog } from "./components/CopyArtworkDialog";
import { DecoratorMatrixDialogs } from "./components/DecoratorMatrixDialogs";
import { FilePreviewDialog } from "./components/FilePreviewDialog";
import { MarginWarningDialog } from "./components/MarginWarningDialog";
import { PricingTiersDialog } from "./components/PricingTiersDialog";
import { SizesColorsDialog } from "./components/SizesColorsDialog";

/** Portal dragged row to document.body so Radix Dialog transform doesn't offset it */
function PortalAwareDrag({ provided, snapshot, children }: {
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  children: React.ReactNode;
}) {
  const el = (
    <tr ref={provided.innerRef} {...provided.draggableProps}
      className={snapshot.isDragging ? "bg-white shadow-lg border rounded opacity-90" : "border-b last:border-0"}
      style={provided.draggableProps.style}
    >
      {children}
    </tr>
  );
  return snapshot.isDragging ? createPortal(el, document.body) : el;
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
    currentMargin?: number;
    numberOfColors?: number;
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
    currentMargin?: number;
    numberOfColors?: number;
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
              <img src={imageUrl} alt={editProductPage.item.productName ?? undefined} className="w-20 h-20 object-contain rounded-lg border bg-white" />
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
                <Button variant="outline" size="xs" onClick={() => setShowPricingTiers(true)}>
                  <DollarSign className="w-3 h-3 mr-1" />
                  Check Pricing
                </Button>
              )}
              {/* <Button variant="outline" size="sm" onClick={() => editProductPage.addLine()">
                <Plus className="w-3 h-3 mr-1" />
                Add Line
              </Button>
              {(editProductPage.productCatalog.colors.length > 0 || editProductPage.productCatalog.sizes.length > 0) && (
                <Button variant="default" size="sm" onClick={() => editProductPage.setShowSizesColors(true)}>
                  <Grid3X3 className="w-3 h-3 mr-1" />
                  Add Sizes & Colors
                </Button>
              )} */}
            </div>
          </div>

          <DragDropContext onDragEnd={(result: DropResult) => {
            if (!result.destination) return;
            const { source, destination } = result;
            if (source.index === destination.index) return;
            if (source.droppableId === "pricing-lines") {
              editProductPage.reorderLine(source.index, destination.index);
            } else if (source.droppableId === "pricing-charges") {
              const sorted = [...editProductPage.charges].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
              const reordered = [...sorted];
              const [moved] = reordered.splice(source.index, 1);
              reordered.splice(destination.index, 0, moved);
              editProductPage.reorderChargesMutation.mutate({
                itemId: itemId,
                chargeIds: reordered.map((c: any) => c.id),
              });
            }
          }}>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-8"></th>
                  <th className="text-left p-3 w-20 font-bold">Color/Size</th>
                  <th className="text-center p-3 font-bold w-20">SKU</th>
                  <th className="text-center p-3 font-bold w-20">QTY</th>
                  <th className="text-right p-3 font-bold w-28">Net Cost</th>
                  <th className="text-right p-3 font-bold w-24">
                    <span title={`Min: ${editProductPage.marginSettings.minimumMargin}% | Target: ${editProductPage.marginSettings.defaultMargin}%`}>
                      Margin
                    </span>
                  </th>
                  <th className="text-right p-3 font-bold w-28">
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
                  <th className="text-right p-3 font-bold w-24">Client Price</th>
                  <th className="text-right p-3 font-bold w-28">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <Droppable droppableId="pricing-lines">
                {(provided) => (
              <tbody ref={provided.innerRef} {...provided.droppableProps}>
                {editProductPage.editableLines.map((line: any, lineIdx: number) => {
                  const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
                  const lineMargin = line.unitPrice > 0
                    ? ((line.unitPrice - line.cost) / line.unitPrice * 100) : 0;
                  const clientPrice = (line.unitPrice || 0) + editProductPage.bakedInChargePerUnit;
                  const hasColors = editProductPage.productCatalog.colors.length > 0;
                  const hasSizes = editProductPage.productCatalog.sizes.length > 0;
                  const colorSizeLabel = [line.color, line.size].filter(Boolean).join(" / ") || "—";

                  return (
                    <Draggable key={line.id} draggableId={`line-${line.id}`} index={lineIdx}>
                      {(dragProvided, dragSnapshot) => (
                    <PortalAwareDrag provided={dragProvided} snapshot={dragSnapshot}>
                      <td className="p-1 w-8">
                        <div {...dragProvided.dragHandleProps} className="flex items-center justify-center cursor-grab">
                          <GripVertical className="w-4 h-4 text-gray-300" />
                        </div>
                      </td>
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
                            <PopoverContent className="w-auto p-0" align="start">
                              <ColorSizePopover
                                colors={editProductPage.productCatalog.colors}
                                sizes={editProductPage.productCatalog.sizes}
                                selectedColor={line.color}
                                selectedSize={line.size}
                                onSelect={(color, size) => {
                                  editProductPage.updateLine(line.id, "color", color);
                                  editProductPage.updateLine(line.id, "size", size);
                                }}
                                onAddCustom={editProductPage.addCustomColorSize}
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
                      {/* SKU */}
                      <td className="p-2">
                        <span className="text-xs text-center text-gray-500 block">{editProductPage.item?.productSku || "—"}</span>
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
                            className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white px-2 pr-5 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
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
                      {clientPrice > 0 && (
                        <td className="p-2 text-right">
                          <span className="text-xs text-gray-600">${clientPrice.toFixed(2)}</span>
                        </td>
                      )}
                      {/* Total */}
                      <td className="p-2 text-right">
                        <span className="text-xs font-semibold">${lineTotal.toFixed(2)}</span>
                      </td>
                      {/* Delete */}
                      {editProductPage.editableLines.length > 1 && (
                        <td className="p-2">
                          <button className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                            onClick={() => editProductPage.removeLine(line.id)}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      )}
                    </PortalAwareDrag>
                    )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </tbody>
                )}
              </Droppable>

              <Droppable droppableId="pricing-charges">
                {(chargeDropProvided) => (
              <tbody ref={chargeDropProvided.innerRef} {...chargeDropProvided.droppableProps}>
                {/* ── Charge rows (CommonSKU-style: inline in same table) ── */}
                {[...editProductPage.charges].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((charge: any, chargeIdx: number) => {
                  const cNetCost = parseFloat(charge.netCost || "0");
                  const cRetail = parseFloat(charge.retailPrice || charge.amount || "0");
                  const cMargin = parseFloat(charge.margin || "0");
                  const isRun = charge.chargeCategory === "run";
                  const cQty = isRun ? (editProductPage.lineTotals.qty || 1) : (charge.quantity || 1);
                  const cTotal = cRetail * cQty;
                  const displayMode = charge.includeInUnitPrice ? "include_in_price"
                    : charge.displayToClient !== false ? "display_to_client"
                      : "subtract_from_margin";

                  return (
                    <Draggable key={`charge-${charge.id}`} draggableId={`charge-${charge.id}`} index={chargeIdx}>
                      {(chargeDragProvided, chargeDragSnapshot) => (
                    <PortalAwareDrag provided={chargeDragProvided} snapshot={chargeDragSnapshot}>
                      <td className="p-1 w-8">
                        <div {...chargeDragProvided.dragHandleProps} className="flex items-center justify-center cursor-grab">
                          <GripVertical className="w-4 h-4 text-gray-300" />
                        </div>
                      </td>
                      {/* Name + badge */}
                      <td colSpan={2} className="p-2">
                        <div className="flex items-center juststa gap-1.5">
                          <BlurTextInput
                            className="h-8 text-xs bg-transparent border focus:outline-none focus:ring-0 w-full px-1"
                            value={charge.description}
                            onCommit={(v) => editProductPage.handleChargeDescriptionChange(charge.id, v)}
                          />
                          <Badge variant="outline" className="text-[9px] px-1 py-0 w-fit border-gray-300 text-gray-600">
                            {isRun ? "Run" : "Fixed"}
                          </Badge>
                        </div>
                      </td>
                      {/* QTY */}
                      <td className="p-2">
                        {isRun ? (
                          <span className="text-xs text-center text-gray-400 block">{cQty}</span>
                        ) : (
                          <PricingInput
                            className="flex h-8 w-full text-xs text-right rounded-md border border-input bg-background px-3 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            step="1"
                            min={1}
                            value={cQty}
                            onCommit={(n) => editProductPage.handleChargeQtyChange(charge.id, n)}
                          />
                        )}
                      </td>
                      {/* Net Cost */}
                      <td className="p-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                          <PricingInput
                            className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                            step="0.01"
                            min={0}
                            value={cNetCost}
                            onCommit={(n) => editProductPage.handleChargeCostChange(charge.id, n)}
                          />
                        </div>
                      </td>
                      {/* Margin */}
                      <td className="p-2">
                        <div className="relative">
                          <PricingInput
                            className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white px-2 pr-5 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                            step="0.1"
                            min={0}
                            max={99.9}
                            value={parseFloat(cMargin.toFixed(1))}
                            onCommit={(n) => editProductPage.handleChargeMarginChange(charge.id, n)}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                        </div>
                      </td>
                      {/* Retail */}
                      <td className="p-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                          <PricingInput
                            className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                            step="0.01"
                            min={0}
                            value={cRetail}
                            onCommit={(n) => editProductPage.handleChargeRetailChange(charge.id, n)}
                          />
                        </div>
                      </td>
                      {/* Client Price / Display Mode */}
                      <td className="p-2">
                        <Select value={displayMode} onValueChange={(v) => editProductPage.handleChargeDisplayModeChange(charge.id, v)}>
                          <SelectTrigger className="h-7 text-[10px] w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="include_in_price">Include in price</SelectItem>
                            <SelectItem value="display_to_client">Display to client</SelectItem>
                            {!isRun && <SelectItem value="subtract_from_margin">Subtract from margin</SelectItem>}
                          </SelectContent>
                        </Select>
                      </td>
                      {/* Total Charges + Display Mode */}
                      <td className="p-2 text-right">
                        <span className="text-xs font-semibold">${cTotal.toFixed(2)}</span>
                      </td>
                      {/* Delete */}
                      <td className="p-2">
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                          onClick={() => editProductPage.deleteChargeMutation.mutate({ chargeId: charge.id, orderItemId: charge.orderItemId })}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </PortalAwareDrag>
                    )}
                    </Draggable>
                  );
                })}
                {chargeDropProvided.placeholder}
              </tbody>
                )}
              </Droppable>
              {/* <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td className="p-3 text-sm font-semibold">Totals</td>
                  <td className="p-3 text-right text-sm font-semibold">{editProductPage.lineTotals.qty}</td>
                  <td className="p-3 text-right text-sm text-gray-500">${editProductPage.productPlusChargeCost.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <span className={`text-sm font-semibold ${editProductPage.marginColor(editProductPage.margin)}`}>
                      {editProductPage.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right text-sm font-semibold">${editProductPage.productPlusChargeSell.toFixed(2)}</td>
                  {editProductPage.bakedInChargePerUnit > 0 && <td className="p-3"></td>}
                  <td className="p-3 text-right text-sm font-bold">${editProductPage.productPlusChargeSell.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot> */}
            </table>
          </div>
          </DragDropContext>

          {/* Action links below table (CommonSKU style) */}
          <div className="flex items-center gap-4 mt-3">
            <Button variant="default" size="xs" onClick={() => editProductPage.addLine()}>
              <Plus className="size-2" />
              Breakdown
            </Button>
            {(editProductPage.productCatalog.colors.length > 0 || editProductPage.productCatalog.sizes.length > 0) && (
              <Button variant="outline" size="xs" onClick={() => editProductPage.setShowAddCharge(true)}>
                <Plus className="size-2" />
                Add Cost
              </Button>
            )}
          </div>

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

                  {/* <div className="flex items-center gap-2 mt-1">
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
                  </div> */}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => editProductPage.setEditingArtwork(art)}
                          title="Edit artwork"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={() => editProductPage.deleteArtworkMutation.mutate({ artworkId: art.id, orderItemId: itemId })}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    {/* CommonSKU-style inline charge rows */}
                    <DragDropContext onDragEnd={(result: DropResult) => {
                      if (!result.destination || result.source.index === result.destination.index) return;
                      const sorted = [...artCharges].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
                      const reordered = [...sorted];
                      const [moved] = reordered.splice(result.source.index, 1);
                      reordered.splice(result.destination.index, 0, moved);
                      editProductPage.reorderArtworkChargesMutation.mutate({
                        artworkId: art.id,
                        chargeIds: reordered.map((c: any) => c.id),
                      });
                    }}>
                    <div className="border-t">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="w-8"></th>
                            <th className="text-left p-3 w-20 font-bold text-sm">Charge</th>
                            <th className="text-center p-3 font-bold text-sm w-20">Qty</th>
                            <th className="text-right p-3 font-bold text-sm w-28">Cost</th>
                            <th className="text-right p-3 font-bold text-sm w-24">Margin</th>
                            <th className="text-right p-3 font-bold text-sm w-28">Retail</th>
                            <th className="px-2 py-1 w-24"></th>
                            <th className="text-right p-3 font-bold text-sm w-28">Total</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <Droppable droppableId={`artwork-charges-${art.id}`}>
                          {(artChargeDropProvided) => (
                        <tbody ref={artChargeDropProvided.innerRef} {...artChargeDropProvided.droppableProps}>
                          {[...artCharges].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((charge: any, artChargeIdx: number) => {
                            const isRun = charge.chargeCategory === "run";
                            const cNetCost = parseFloat(charge.netCost || "0");
                            const cMargin = parseFloat(charge.margin || "0");
                            const cRetail = cMargin > 0 && cMargin < 100 ? cNetCost / (1 - cMargin / 100) : cNetCost;
                            const cQty = isRun ? (editProductPage.lineTotals.qty || 1) : (charge.quantity || 1);
                            const cTotal = cRetail * cQty;
                            return (
                              <Draggable key={`artcharge-${charge.id}`} draggableId={`artcharge-${charge.id}`} index={artChargeIdx}>
                                {(artChargeDragProvided, artChargeDragSnapshot) => (
                              <PortalAwareDrag provided={artChargeDragProvided} snapshot={artChargeDragSnapshot}>
                                <td className="p-1 w-8">
                                  <div {...artChargeDragProvided.dragHandleProps} className="flex items-center justify-center cursor-grab">
                                    <GripVertical className="w-4 h-4 text-gray-300" />
                                  </div>
                                </td>
                                {/* Name + matrix + badge */}
                                <td className="p-2">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      className="text-xs h-8 font-medium bg-transparent border outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5 flex-1 "
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
                                    {editProductPage.editItemData.decoratorType === "third_party" && (
                                      <button
                                        className="w-4 h-4 flex items-center justify-center text-blue-400 hover:text-blue-600"
                                        title="Select pricing from decorator matrix"
                                        onClick={() => setMatrixPickerTarget({
                                          artworkId: art.id,
                                          chargeId: charge.id,
                                          chargeName: charge.chargeName || (isRun ? "Imprint Cost" : "Setup Cost"),
                                          chargeType: isRun ? "run" : "fixed",
                                          currentMargin: cMargin,
                                          numberOfColors: art.numberOfColors || 1,
                                        })}
                                      >
                                        <Grid3X3 className="w-3 h-3" />
                                      </button>
                                    )}
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 w-fit border-gray-300 text-gray-600">
                                      {isRun ? "Run" : "Fixed"}
                                    </Badge>
                                  </div>
                                </td>
                                {/* QTY */}
                                <td className="p-2">
                                  {isRun ? (
                                    <span className="text-xs text-center text-gray-400 block">{cQty}</span>
                                  ) : (
                                    <PricingInput
                                      className="flex h-8 w-full text-xs text-right rounded-md border border-input bg-background px-3 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                      step="1"
                                      min={1}
                                      value={cQty}
                                      onCommit={(n) => {
                                        if (n !== charge.quantity) {
                                          editProductPage.updateArtworkChargeMutation.mutate({
                                            artworkId: art.id, chargeId: charge.id,
                                            updates: { quantity: n },
                                          });
                                        }
                                      }}
                                    />
                                  )}
                                </td>
                                {/* Net Cost */}
                                <td className="p-2">
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                    <PricingInput
                                      className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                                      step="0.01"
                                      min={0}
                                      value={cNetCost}
                                      onCommit={(val) => {
                                        if (Math.abs(val - cNetCost) > 0.001) {
                                          const retail = cMargin > 0 && cMargin < 100 ? val / (1 - cMargin / 100) : val;
                                          editProductPage.updateArtworkChargeMutation.mutate({
                                            artworkId: art.id, chargeId: charge.id,
                                            updates: { netCost: val.toFixed(2), retailPrice: retail.toFixed(2) },
                                          });
                                        }
                                      }}
                                    />
                                  </div>
                                </td>
                                {/* Margin % */}
                                <td className="p-2">
                                  <div className="relative">
                                    <PricingInput
                                      className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white px-2 pr-5 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                                      step="0.1"
                                      min={0}
                                      max={99.9}
                                      value={parseFloat(cMargin.toFixed(1))}
                                      onCommit={(val) => {
                                        if (Math.abs(val - cMargin) > 0.1) {
                                          const retail = val > 0 && val < 100 ? cNetCost / (1 - val / 100) : cNetCost;
                                          editProductPage.updateArtworkChargeMutation.mutate({
                                            artworkId: art.id, chargeId: charge.id,
                                            updates: { margin: val.toFixed(2), retailPrice: retail.toFixed(2) },
                                          });
                                        }
                                      }}
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                                  </div>
                                </td>
                                {/* Sell (read-only) */}
                                <td className="p-2">
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                    <span className="block h-8 text-xs text-right rounded border border-gray-200 bg-gray-50 pl-5 pr-2 leading-8 tabular-nums">
                                      {cRetail.toFixed(2)}
                                    </span>
                                  </div>
                                </td>
                                {/* Display mode */}
                                <td className="p-2">
                                  <Select
                                    defaultValue={charge.displayMode || "display_to_client"}
                                    onValueChange={(v) => {
                                      editProductPage.updateArtworkChargeMutation.mutate({
                                        artworkId: art.id, chargeId: charge.id,
                                        updates: { displayMode: v },
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-[10px] w-full">
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
                                </td>
                                {/* Total */}
                                <td className="p-2 text-right">
                                  <span className="text-xs font-semibold">${cTotal.toFixed(2)}</span>
                                </td>
                                {/* Delete */}
                                <td className="p-2">
                                  <button
                                    className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => editProductPage.deleteArtworkChargeMutation.mutate({ artworkId: art.id, chargeId: charge.id })}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </td>
                              </PortalAwareDrag>
                                )}
                              </Draggable>
                            );
                          })}
                          {artChargeDropProvided.placeholder}
                        </tbody>
                          )}
                        </Droppable>
                      </table>

                      {/* Quick add links — CommonSKU style */}
                      <div className="flex items-center gap-4 px-3 py-1.5 text-[10px]">
                        <Button
                          size="xs"
                          variant={"outline"}
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
                        </Button>
                        <Button
                          size="xs"
                          variant={"outline"}
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
                        </Button>
                        <Button
                          size="xs"
                          variant={"outline"}
                          className="ml-auto"
                          onClick={() => editProductPage.setCopyingArtworkId(art.id)}
                        >
                          + Copy item location
                        </Button>
                      </div>
                    </div>
                    </DragDropContext>
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

        // ── Product-only margin (for the breakdown display — NOT product+charges) ──
        const productOnlyMarginPercent = calcMarginPercent(productSellTotal, productCostTotal);

        // ── Minimum margin check (uses admin setting) ──
        const belowMinimum = isBelowMinimum(itemMarginPercent, editProductPage.marginSettings);

        return (
          <div className="flex justify-between items-start gap-4 bg-primary p-6 rounded-lg">
            {/* Left: Margin summary with full breakdown */}
            <div className="bg-white rounded-lg border p-4 space-y-1.5 w-80">
              {/* Detailed breakdown */}
              <div className="border-b pb-2 mt-2 space-y-1.5">
                {/* Product layer */}
                <div>
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span className="font-medium">Product</span>
                    <span className={`font-semibold`}>
                      {productOnlyMarginPercent.toFixed(1)}%
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
                      <span className={`font-semibold`}>
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
                      <span className={`font-semibold`}>
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

              {/* Minimum margin warning
              {belowMinimum && (
                <div className={`mt-2 pt-2 border-t border-red-200 text-xs text-red-700 bg-red-50 -mx-4 px-4 py-2 ${!(decoMarginPercent < 0 && decoSellTotal > 0) ? "" : ""} ${decoMarginPercent < 0 && decoSellTotal > 0 ? "" : "-mb-4 rounded-b-lg"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        Overall margin ({itemMarginPercent.toFixed(1)}%) is below the company minimum of {editProductPage.marginSettings.minimumMargin}%.
                        Saving will require confirmation.
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-100 flex-shrink-0 h-6 text-[10px] px-2"
                      onClick={() => editProductPage.applyMarginToAllLines(editProductPage.marginSettings.defaultMargin)}
                    >
                      Apply {editProductPage.marginSettings.defaultMargin}% to All
                    </Button>
                  </div>
                </div>
              )} */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-semibold">Overall Margin</span>
                <span className={`font-bold`}>
                  {itemMarginPercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-semibold">Margin Amount</span>
                <span className={`font-semibold ${itemProfitTotal < 0 ? "text-red-600" : ""}`}>${itemProfitTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Right: Subtotal / Tax / Total */}
            <div className="bg-gray-50 rounded-lg flex flex-col h-full border p-4 space-y-2 w-72">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-semibold">Subtotal</span>
                <span className="font-medium">${productPlusCharges.toFixed(2)}</span>
              </div>
              {decoSellTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-semibold">Decoration</span>
                  <span className="font-medium">${decoSellTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-semibold">Tax</span>
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

      {/* EDIT ARTWORK DIALOG */}
      <EditArtworkDialog
        projectId={projectId}
        artwork={editProductPage.editingArtwork}
        onClose={() => editProductPage.setEditingArtwork(null)}
        onSave={editProductPage.handleUpdateArtwork}
        isSaving={editProductPage.updateArtworkMutation.isPending}
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
        productName={editProductPage.item?.productName ?? undefined}
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

// Local-state text input — commits to parent only on blur/Enter.
function BlurTextInput({
  value,
  onCommit,
  className,
  placeholder,
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) setDraft(value ?? "");
  }, [value]);

  return (
    <input
      className={className}
      value={draft}
      placeholder={placeholder}
      onFocus={() => { isFocusedRef.current = true; }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        isFocusedRef.current = false;
        if (draft !== value) onCommit(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
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
