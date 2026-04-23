import FilePickerDialog from "@/components/modals/FilePickerDialog";
import { AddEditChargeDialog } from "@/components/sections/EditProductPage/components/AddEditChargeDialog";
import { EditArtworkDialog } from "@/components/sections/EditProductPage/components/EditArtworkDialog";
import MatrixChargePicker from "@/components/modals/MatrixChargePicker";
import TierPricingPanel from "@/components/sections/TierPricingPanel";
import { ColorSizePopover } from "@/components/shared/ColorSizePopover";
import { ImprintOptionSelect } from "@/components/shared/ImprintOptionSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calcMarginPercent } from "@/lib/pricing";
import { getQueryFn } from "@/lib/queryClient";
import { getCloudinaryThumbnail } from "@/lib/media-library";
import { formatLabel } from "@/lib/utils";
import type { ProjectData } from "@/types/project-types";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ChevronDown,
  DollarSign,
  FileText,
  Grid3X3,
  GripVertical,
  ImageIcon,
  Image as ImageLucide,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Repeat,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot } from "react-beautiful-dnd";
import type { ConfigLine, LocalArtwork, LocalArtworkCharge, LocalCharge, ProductResult } from "../types";

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

interface ProductConfigDialogProps {
  selectedProduct: ProductResult | null;
  onClose: () => void;
  projectId: string;
  data: ProjectData;
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
  // Local charges
  localCharges: LocalCharge[];
  addLocalCharge: (charge: Omit<LocalCharge, "tempId">) => void;
  updateLocalCharge: (tempId: string, updates: Partial<LocalCharge>) => void;
  removeLocalCharge: (tempId: string) => void;
  showAddCharge: boolean;
  setShowAddCharge: (v: boolean) => void;
  editingChargeIdx: number | null;
  setEditingChargeIdx: (v: number | null) => void;
  newCharge: Omit<LocalCharge, "tempId">;
  setNewCharge: (updater: (prev: any) => any) => void;
  EMPTY_CHARGE: Omit<LocalCharge, "tempId">;
  // Local artworks
  localArtworks: LocalArtwork[];
  removeLocalArtwork: (tempId: string) => void;
  addLocalArtworkCharge: (artworkTempId: string, charge: Omit<LocalArtworkCharge, "tempId">) => void;
  updateLocalArtworkCharge: (artworkTempId: string, chargeTempId: string, updates: Partial<LocalArtworkCharge>) => void;
  removeLocalArtworkCharge: (artworkTempId: string, chargeTempId: string) => void;
  updateLocalArtwork: (tempId: string, updates: Partial<LocalArtwork>) => void;
  editingLocalArtwork: LocalArtwork | null;
  setEditingLocalArtwork: (v: LocalArtwork | null) => void;
  // Decorator
  decoratorType: "supplier" | "third_party";
  setDecoratorType: (v: "supplier" | "third_party") => void;
  decoratorId: string;
  setDecoratorId: (v: string) => void;
  // Reorder
  reorderConfigLines: (srcIdx: number, destIdx: number) => void;
  reorderLocalCharges: (srcIdx: number, destIdx: number) => void;
  reorderLocalArtworkCharges: (artTempId: string, srcIdx: number, destIdx: number) => void;
  // Artwork dialog
  pickingArtwork: boolean;
  setPickingArtwork: (v: boolean) => void;
  handleArtworkFilePicked: (files: any[]) => void;
  artPickedFile: { filePath: string; fileName: string } | null;
  artUploadName: string;
  setArtUploadName: (v: string) => void;
  artUploadLocation: string;
  setArtUploadLocation: (v: string) => void;
  artUploadMethod: string;
  setArtUploadMethod: (v: string) => void;
  artUploadSize: string;
  setArtUploadSize: (v: string) => void;
  artUploadColor: string;
  setArtUploadColor: (v: string) => void;
  artUploadNumberOfColors: number;
  setArtUploadNumberOfColors: (v: number) => void;
  artUploadRepeatLogo: boolean;
  setArtUploadRepeatLogo: (v: boolean) => void;
  handleCreateLocalArtwork: () => void;
  resetArtForm: () => void;
}

export function ProductConfigDialog({
  selectedProduct,
  onClose,
  projectId,
  data,
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
  // Charges
  localCharges,
  addLocalCharge,
  updateLocalCharge,
  removeLocalCharge,
  showAddCharge,
  setShowAddCharge,
  editingChargeIdx,
  setEditingChargeIdx,
  newCharge,
  setNewCharge,
  EMPTY_CHARGE,
  // Artworks
  localArtworks,
  removeLocalArtwork,
  addLocalArtworkCharge,
  updateLocalArtworkCharge,
  removeLocalArtworkCharge,
  updateLocalArtwork,
  editingLocalArtwork,
  setEditingLocalArtwork,
  // Decorator
  decoratorType,
  setDecoratorType,
  decoratorId,
  setDecoratorId,
  // Reorder
  reorderConfigLines,
  reorderLocalCharges,
  reorderLocalArtworkCharges,
  // Artwork dialog
  pickingArtwork,
  setPickingArtwork,
  handleArtworkFilePicked,
  artPickedFile,
  artUploadName,
  setArtUploadName,
  artUploadLocation,
  setArtUploadLocation,
  artUploadMethod,
  setArtUploadMethod,
  artUploadSize,
  setArtUploadSize,
  artUploadColor,
  setArtUploadColor,
  artUploadNumberOfColors,
  setArtUploadNumberOfColors,
  artUploadRepeatLogo,
  setArtUploadRepeatLogo,
  handleCreateLocalArtwork,
  resetArtForm,
}: ProductConfigDialogProps) {

  const [taxCodeId, setTaxCodeId] = useState("");
  const [matrixPickerTarget, setMatrixPickerTarget] = useState<{
    artworkTempId: string;
    chargeTempId: string;
    chargeName: string;
    chargeType: "run" | "fixed";
    currentMargin?: number;
    numberOfColors?: number;
  } | null>(null);

  const { data: taxCodes } = useQuery<any[]>({
    queryKey: ["/api/tax-codes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Adapter: make local charge CRUD look like mutations for AddEditChargeDialog
  const coerceChargeNumbers = (c: any) => ({
    ...c,
    amount: parseFloat(c.amount) || 0,
    netCost: parseFloat(c.netCost) || 0,
    retailPrice: parseFloat(c.retailPrice) || 0,
    margin: parseFloat(c.margin) || 0,
    quantity: parseInt(c.quantity) || 1,
  });
  const chargeAddAdapter = {
    isPending: false,
    mutate: (args: any, opts?: any) => {
      addLocalCharge(coerceChargeNumbers(args.charge));
      opts?.onSuccess?.();
    },
  };
  const chargeUpdateAdapter = {
    isPending: false,
    mutate: (args: any, opts?: any) => {
      if (editingChargeIdx !== null && localCharges[editingChargeIdx]) {
        updateLocalCharge(localCharges[editingChargeIdx].tempId, coerceChargeNumbers(args.updates));
      }
      opts?.onSuccess?.();
    },
  };

  const editingChargeObj = editingChargeIdx !== null && localCharges[editingChargeIdx]
    ? { ...localCharges[editingChargeIdx], id: localCharges[editingChargeIdx].tempId, orderItemId: "local" }
    : null;

  // ── Pricing calculations ──
  const bakedInChargePerUnit = localCharges
    .filter(c => c.chargeCategory === "run" && c.includeInUnitPrice)
    .reduce((s, c) => s + c.retailPrice, 0);

  const productSellTotal = configTotalPrice;
  const productCostTotal = configTotalCost;
  const productMarginPercent = calcMarginPercent(productSellTotal, productCostTotal);

  let chargeSellTotal = 0;
  let chargeCostTotal = 0;
  for (const c of localCharges) {
    const cQty = c.chargeCategory === "run" ? configTotalQty : c.quantity;
    if (c.includeInUnitPrice || c.displayToClient !== false) {
      chargeSellTotal += c.retailPrice * cQty;
    }
    chargeCostTotal += c.netCost * cQty;
  }

  let decoSellTotal = 0;
  let decoCostTotal = 0;
  for (const art of localArtworks) {
    for (const ac of art.charges) {
      const acQty = ac.chargeCategory === "run" ? configTotalQty : ac.quantity;
      if (ac.displayMode !== "subtract_from_margin") {
        decoSellTotal += ac.retailPrice * acQty;
      }
      decoCostTotal += ac.netCost * acQty;
    }
  }

  const productPlusCharges = productSellTotal + chargeSellTotal;
  const itemSellGrandTotal = productPlusCharges + decoSellTotal;
  const itemCostGrandTotal = productCostTotal + chargeCostTotal + decoCostTotal;
  const itemProfitTotal = itemSellGrandTotal - itemCostGrandTotal;
  const itemMarginPercent = calcMarginPercent(itemSellGrandTotal, itemCostGrandTotal);

  const effectiveTaxCodeId = taxCodeId || (data.order as any)?.defaultTaxCodeId;
  const currentTaxCode = effectiveTaxCodeId
    ? (taxCodes || []).find((tc: any) => tc.id === effectiveTaxCodeId)
    : null;
  const taxRate = currentTaxCode ? parseFloat(currentTaxCode.rate || "0") : 0;
  const taxAmount = itemSellGrandTotal * (taxRate / 100);
  const grandTotalWithTax = itemSellGrandTotal + taxAmount;

  const decoMarginPercent = calcMarginPercent(decoSellTotal, decoCostTotal);
  const chargeMarginPercent = calcMarginPercent(chargeSellTotal, chargeCostTotal);

  const hasColors = (selectedProduct?.colors?.length ?? 0) > 0;
  const hasSizes = (selectedProduct?.sizes?.length ?? 0) > 0;

  // Suppliers list for decorator picker
  const suppliers = (data as any).suppliers || [];

  // DnD handler for lines + charges
  const handleLineDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;
    if (source.droppableId === "config-lines") {
      reorderConfigLines(source.index, destination.index);
    } else if (source.droppableId === "config-charges") {
      reorderLocalCharges(source.index, destination.index);
    }
  };

  // DnD handler for artwork charges
  const handleArtChargeDragEnd = (artTempId: string) => (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;
    reorderLocalArtworkCharges(artTempId, source.index, destination.index);
  };

  return (
    <>
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                  <ImprintOptionSelect type="location" value={imprintLocation} onChange={setImprintLocation} />
                </div>
                <div>
                  <Label>Imprint Method</Label>
                  {selectedProduct.decorationMethods && selectedProduct.decorationMethods.length > 0 ? (
                    <Select
                      value={(selectedProduct.decorationMethods as string[]).includes(imprintMethod) ? imprintMethod : (imprintMethod ? "__custom__" : "")}
                      onValueChange={(v) => setImprintMethod(v === "__custom__" ? "" : v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        {selectedProduct.decorationMethods.map((m: string) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                        <SelectItem value="__custom__">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <ImprintOptionSelect type="method" value={imprintMethod} onChange={setImprintMethod} />
                  )}
                  {selectedProduct.decorationMethods
                    && selectedProduct.decorationMethods.length > 0
                    && !(selectedProduct.decorationMethods as string[]).includes(imprintMethod)
                    && imprintMethod !== undefined
                    && (
                    <Input className="mt-2" placeholder="Enter custom method" value={imprintMethod}
                      onChange={(e) => setImprintMethod(e.target.value)} />
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

              {/* ── Merged Pricing Table (lines + charges) ── */}
              <div>
                <DragDropContext onDragEnd={handleLineDragEnd}>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="w-8"></th>
                        <th className="text-left p-3 w-20 font-bold">Color/Size</th>
                        <th className="text-center p-3 font-bold w-20">SKU</th>
                        <th className="text-center p-3 font-bold w-20">QTY</th>
                        <th className="text-right p-3 font-bold w-28">Net Cost</th>
                        <th className="text-right p-3 font-bold w-24">Margin</th>
                        <th className="text-right p-3 font-bold w-28">Retail</th>
                        {bakedInChargePerUnit > 0 && (
                          <th className="text-right p-3 font-bold w-24">Client Price</th>
                        )}
                        <th className="text-right p-3 font-bold w-28">Total</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <Droppable droppableId="config-lines">
                      {(droppableProvided) => (
                    <tbody ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                      {/* Line item rows */}
                      {configLines.map((line, lineIdx) => {
                        const lineTotal = line.quantity * line.unitPrice;
                        const lineMargin = calcMarginPercent(line.unitPrice, line.unitCost);
                        const clientPrice = (line.unitPrice || 0) + bakedInChargePerUnit;
                        const colorSizeLabel = [line.color, line.size].filter(Boolean).join(" / ") || "-";

                        return (
                          <Draggable key={line.id} draggableId={`line-${line.id}`} index={lineIdx}>
                            {(dragProvided, dragSnapshot) => (
                          <PortalAwareDrag provided={dragProvided} snapshot={dragSnapshot}>
                            <td className="p-1 w-8">
                              <div {...dragProvided.dragHandleProps} className="flex items-center justify-center cursor-grab">
                                <GripVertical className="w-4 h-4 text-gray-300" />
                              </div>
                            </td>
                            {/* Color/Size */}
                            <td className="p-2">
                              {(hasColors || hasSizes) ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="h-8 w-full text-left text-xs px-2 rounded border border-gray-200 bg-white hover:bg-gray-50 truncate flex items-center justify-between gap-1">
                                      <span className={colorSizeLabel === "-" ? "text-gray-400" : ""}>{colorSizeLabel}</span>
                                      <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <ColorSizePopover
                                      colors={selectedProduct?.colors || []}
                                      sizes={selectedProduct?.sizes || []}
                                      selectedColor={line.color}
                                      selectedSize={line.size}
                                      onSelect={(color, size) => {
                                        updateConfigLine(line.id, "color", color);
                                        updateConfigLine(line.id, "size", size);
                                      }}
                                    />
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <div className="flex gap-1">
                                  <Input className="h-8 text-xs flex-1" value={line.color}
                                    onChange={(e) => updateConfigLine(line.id, "color", e.target.value)} placeholder="Color" />
                                  <Input className="h-8 text-xs w-20" value={line.size}
                                    onChange={(e) => updateConfigLine(line.id, "size", e.target.value)} placeholder="Size" />
                                </div>
                              )}
                            </td>
                            {/* SKU */}
                            <td className="p-2">
                              <span className="text-xs text-center text-gray-500 block">{selectedProduct?.sku || "-"}</span>
                            </td>
                            {/* QTY */}
                            <td className="p-2">
                              <Input className="h-8 text-xs text-right" type="number" min={1} value={line.quantity}
                                onChange={(e) => updateConfigLine(line.id, "quantity", parseInt(e.target.value) || 0)} />
                            </td>
                            {/* Net Cost */}
                            <td className="p-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                <input className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                                  type="number" step="0.01" min={0} value={line.unitCost}
                                  onChange={(e) => handleConfigCostChange(line.id, e)} />
                              </div>
                            </td>
                            {/* Margin */}
                            <td className="p-2">
                              <div className="relative">
                                <input className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white px-2 pr-5 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                                  type="number" step="0.1" min={0} max={99.9}
                                  value={parseFloat(lineMargin.toFixed(1))}
                                  onChange={(e) => handleConfigMarginChange(line.id, e)} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                              </div>
                            </td>
                            {/* Retail */}
                            <td className="p-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                <input className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 font-semibold"
                                  type="number" step="0.01" min={0} value={line.unitPrice}
                                  onChange={(e) => updateConfigLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)} />
                              </div>
                            </td>
                            {/* Client Price */}
                            {bakedInChargePerUnit > 0 && (
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
                              {configLines.length > 1 && (
                                <button className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                                  onClick={() => removeConfigLine(line.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </PortalAwareDrag>
                            )}
                          </Draggable>
                        );
                      })}
                      {droppableProvided.placeholder}
                    </tbody>
                      )}
                    </Droppable>

                    {/* ── Charge rows (merged inline) ── */}
                    <Droppable droppableId="config-charges">
                      {(chargeDropProvided) => (
                    <tbody ref={chargeDropProvided.innerRef} {...chargeDropProvided.droppableProps}>
                      {localCharges.map((ch, idx) => {
                        const isRun = ch.chargeCategory === "run";
                        const cQty = isRun ? configTotalQty : ch.quantity;
                        const cTotal = ch.retailPrice * cQty;
                        const displayMode = ch.includeInUnitPrice ? "include_in_price"
                          : ch.displayToClient !== false ? "display_to_client"
                            : "subtract_from_margin";

                        return (
                          <Draggable key={ch.tempId} draggableId={`charge-${ch.tempId}`} index={idx}>
                            {(chargeDragProvided, chargeDragSnapshot) => (
                          <PortalAwareDrag provided={chargeDragProvided} snapshot={chargeDragSnapshot}>
                            <td className="p-1 w-8">
                              <div {...chargeDragProvided.dragHandleProps} className="flex items-center justify-center cursor-grab">
                                <GripVertical className="w-4 h-4 text-gray-300" />
                              </div>
                            </td>
                            <td colSpan={1} className="p-2">
                              <div className="flex items-center gap-1.5">
                                <input
                                  className="h-8 text-xs bg-transparent border rounded px-1 flex-1 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-300"
                                  value={ch.description}
                                  onChange={(e) => updateLocalCharge(ch.tempId, { description: e.target.value })}
                                />
                                <Badge variant="outline" className="text-[9px] px-1 py-0 w-fit border-gray-300 text-gray-600">
                                  {isRun ? "Run" : "Fixed"}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-2">
                              {isRun ? (
                                <span className="text-xs text-center text-gray-400 block">{cQty}</span>
                              ) : (
                                <Input className="h-8 text-xs text-right" type="number" min={1} value={ch.quantity}
                                  onChange={(e) => updateLocalCharge(ch.tempId, { quantity: parseInt(e.target.value) || 1 })} />
                              )}
                            </td>
                            <td className="p-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                <input className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  type="number" step="0.01" min={0} value={ch.netCost || ""}
                                  onChange={(e) => {
                                    const cost = parseFloat(e.target.value) || 0;
                                    const m = ch.margin || 0;
                                    const retail = m > 0 && m < 100 ? parseFloat((cost / (1 - m / 100)).toFixed(2)) : cost;
                                    updateLocalCharge(ch.tempId, { netCost: cost, retailPrice: retail });
                                  }} />
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="relative">
                                <input className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white px-2 pr-5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  type="number" step="0.1" min={0} max={99.9} value={ch.margin || ""}
                                  onChange={(e) => {
                                    const m = parseFloat(e.target.value) || 0;
                                    const cost = ch.netCost || 0;
                                    const retail = cost > 0 && m > 0 && m < 100 ? parseFloat((cost / (1 - m / 100)).toFixed(2)) : cost;
                                    updateLocalCharge(ch.tempId, { margin: m, retailPrice: retail });
                                  }} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                <input className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  type="number" step="0.01" min={0} value={ch.retailPrice || ""}
                                  onChange={(e) => {
                                    const retail = parseFloat(e.target.value) || 0;
                                    const cost = ch.netCost || 0;
                                    const m = retail > 0 && cost > 0 ? parseFloat(((retail - cost) / retail * 100).toFixed(2)) : 0;
                                    updateLocalCharge(ch.tempId, { retailPrice: retail, margin: m });
                                  }} />
                              </div>
                            </td>
                            {bakedInChargePerUnit > 0 && (
                              <td className="p-2">
                                <Select value={displayMode} onValueChange={(v) => {
                                  updateLocalCharge(ch.tempId, {
                                    includeInUnitPrice: v === "include_in_price",
                                    displayToClient: v !== "subtract_from_margin",
                                  });
                                }}>
                                  <SelectTrigger className="h-7 text-[10px] w-full"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="include_in_price">Include in price</SelectItem>
                                    <SelectItem value="display_to_client">Display to client</SelectItem>
                                    {!isRun && <SelectItem value="subtract_from_margin">Subtract from margin</SelectItem>}
                                  </SelectContent>
                                </Select>
                              </td>
                            )}
                            <td className="p-2 text-right">
                              <span className="text-xs font-semibold">${cTotal.toFixed(2)}</span>
                            </td>
                            <td className="p-2">
                              <button className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                                onClick={() => removeLocalCharge(ch.tempId)}>
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
                  </table>
                </div>
                </DragDropContext>

                {/* Action links below table */}
                <div className="flex items-center gap-4 mt-3">
                  <Button variant="default" size="xs" onClick={addConfigLine}>
                    <Plus className="size-2" />
                    Breakdown
                  </Button>
                  <Button variant="outline" size="xs" onClick={() => {
                    setEditingChargeIdx(null);
                    setNewCharge(() => ({ ...EMPTY_CHARGE }));
                    setShowAddCharge(true);
                  }}>
                    <Plus className="size-2" />
                    Add Cost
                  </Button>
                </div>
              </div>

              {/* ── Decorations / Artwork (EditProductPage style) ── */}
              <div>
                <div className="flex items-end justify-between mb-4">
                  <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-lg flex items-center gap-1.5">
                      <ImageLucide className="w-4 h-4 text-gray-400" />
                      Decorations {localArtworks.length > 0 && `(${localArtworks.length})`}
                    </h3>
                    {/* Decorator Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          Decorator Type
                        </Label>
                        <Select
                          value={decoratorType}
                          onValueChange={(v: "supplier" | "third_party") => {
                            setDecoratorType(v);
                            if (v === "supplier") setDecoratorId("");
                          }}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="supplier">Supplier Decorator</SelectItem>
                            <SelectItem value="third_party">Third-Party Decorator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {decoratorType === "third_party" && (
                        <div>
                          <Label>Third-Party Decorator</Label>
                          <Select
                            value={decoratorId}
                            onValueChange={setDecoratorId}
                          >
                            <SelectTrigger><SelectValue placeholder="Select decorator..." /></SelectTrigger>
                            <SelectContent>
                              {suppliers
                                .filter((s: any) => s.isDecorator)
                                .map((s: any) => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              {suppliers.filter((s: any) => s.isDecorator).length === 0 && (
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
                  <Button variant="outline" size="sm" onClick={() => setPickingArtwork(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Decoration Location
                  </Button>
                </div>

                {localArtworks.length > 0 ? (
                  <div className="space-y-3">
                    {localArtworks.map((art) => {
                      const displayFiles = art.filePath
                        ? [{ id: "primary", filePath: art.filePath, fileName: art.name }]
                        : [];

                      return (
                        <div key={art.tempId} className="border rounded-lg bg-white overflow-hidden">
                          {/* Artwork header row */}
                          <div className="p-3 flex gap-3 items-start">
                            {/* Thumbnails */}
                            <div className="flex gap-1.5 flex-shrink-0">
                              {displayFiles.length > 0 ? displayFiles.map((f: any, idx: number) => (
                                <div key={f.id || idx}
                                  className="w-14 h-14 bg-gray-50 rounded border overflow-hidden flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-300 transition-shadow"
                                >
                                  {(() => {
                                    const ext = (f.filePath || "").split("?")[0].split(".").pop()?.toLowerCase();
                                    const isDesign = ["ai", "eps", "psd"].includes(ext || "");
                                    const src = isDesign && (f.filePath || "").includes("cloudinary.com")
                                      ? getCloudinaryThumbnail(f.filePath, 112, 112)
                                      : f.filePath;
                                    return <img src={src} alt={f.fileName} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
                                  })()}
                                </div>
                              )) : (
                                <div className="w-14 h-14 bg-gray-50 rounded border flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-gray-300" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{art.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {art.location && <span className="text-[10px] text-gray-500">{formatLabel(art.location)}</span>}
                                {art.artworkType && <span className="text-[10px] text-gray-400">\u00B7 {formatLabel(art.artworkType)}</span>}
                                {art.size && <span className="text-[10px] text-gray-400">\u00B7 {formatLabel(art.size)}</span>}
                                {art.repeatLogo && (
                                  <Badge variant="outline" className="text-[9px] border-purple-200 text-purple-600">
                                    <Repeat className="w-2.5 h-2.5 mr-0.5" /> repeat
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Edit + Delete */}
                            <div className="flex items-center gap-1">
                              <button className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50"
                                onClick={() => setEditingLocalArtwork(art)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                                onClick={() => removeLocalArtwork(art.tempId)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Nested charges table */}
                          <div className="border-t">
                            <DragDropContext onDragEnd={handleArtChargeDragEnd(art.tempId)}>
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
                              <Droppable droppableId={`art-charges-${art.tempId}`}>
                                {(artChargeDropProvided) => (
                              <tbody ref={artChargeDropProvided.innerRef} {...artChargeDropProvided.droppableProps}>
                                {art.charges.map((ac, acIdx) => {
                                  const isRun = ac.chargeCategory === "run";
                                  const acQty = isRun ? configTotalQty : ac.quantity;
                                  const acTotal = ac.retailPrice * acQty;

                                  return (
                                    <Draggable key={ac.tempId} draggableId={`artcharge-${ac.tempId}`} index={acIdx}>
                                      {(artChargeDragProvided, artChargeDragSnapshot) => (
                                    <PortalAwareDrag provided={artChargeDragProvided} snapshot={artChargeDragSnapshot}>
                                      <td className="p-1 w-8">
                                        <div {...artChargeDragProvided.dragHandleProps} className="flex items-center justify-center cursor-grab">
                                          <GripVertical className="w-4 h-4 text-gray-300" />
                                        </div>
                                      </td>
                                      <td className="p-2">
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            className="text-xs h-8 font-medium bg-transparent border outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5 flex-1"
                                            value={ac.chargeName}
                                            onChange={(e) => updateLocalArtworkCharge(art.tempId, ac.tempId, { chargeName: e.target.value })}
                                          />
                                          {decoratorType === "third_party" && decoratorId && (
                                            <button
                                              className="w-4 h-4 flex items-center justify-center text-blue-400 hover:text-blue-600"
                                              title="Select pricing from decorator matrix"
                                              onClick={() => setMatrixPickerTarget({
                                                artworkTempId: art.tempId,
                                                chargeTempId: ac.tempId,
                                                chargeName: ac.chargeName || (isRun ? "Imprint Cost" : "Setup Cost"),
                                                chargeType: isRun ? "run" : "fixed",
                                                currentMargin: ac.margin,
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
                                      <td className="p-2">
                                        {isRun ? (
                                          <span className="text-xs text-center text-gray-400 block">{acQty}</span>
                                        ) : (
                                          <input
                                            className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white px-2"
                                            type="number" min={1} value={ac.quantity}
                                            onChange={(e) => updateLocalArtworkCharge(art.tempId, ac.tempId, { quantity: parseInt(e.target.value) || 1 })}
                                          />
                                        )}
                                      </td>
                                      <td className="p-2">
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                          <input
                                            className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white pl-5 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            type="number" step="0.01" min={0} value={ac.netCost || ""}
                                            onChange={(e) => {
                                              const cost = parseFloat(e.target.value) || 0;
                                              const m = ac.margin || 0;
                                              const retail = m > 0 && m < 100 ? parseFloat((cost / (1 - m / 100)).toFixed(2)) : cost;
                                              updateLocalArtworkCharge(art.tempId, ac.tempId, { netCost: cost, retailPrice: retail });
                                            }}
                                          />
                                        </div>
                                      </td>
                                      <td className="p-2">
                                        <div className="relative">
                                          <input
                                            className="w-full h-8 text-xs text-right rounded border border-gray-200 bg-white px-2 pr-5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            type="number" step="0.1" min={0} max={99.9} value={ac.margin || ""}
                                            onChange={(e) => {
                                              const m = parseFloat(e.target.value) || 0;
                                              const cost = ac.netCost || 0;
                                              const retail = cost > 0 && m > 0 && m < 100 ? parseFloat((cost / (1 - m / 100)).toFixed(2)) : cost;
                                              updateLocalArtworkCharge(art.tempId, ac.tempId, { margin: m, retailPrice: retail });
                                            }}
                                          />
                                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                                        </div>
                                      </td>
                                      <td className="p-2">
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                          <span className="block h-8 text-xs text-right rounded border border-gray-200 bg-gray-50 pl-5 pr-2 leading-8 tabular-nums">
                                            {ac.retailPrice.toFixed(2)}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-2">
                                        <Select
                                          value={ac.displayMode}
                                          onValueChange={(v) => updateLocalArtworkCharge(art.tempId, ac.tempId, { displayMode: v as any })}
                                        >
                                          <SelectTrigger className="h-8 text-[10px] w-full"><SelectValue /></SelectTrigger>
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
                                      <td className="p-2 text-right">
                                        <span className="text-xs font-semibold">${acTotal.toFixed(2)}</span>
                                      </td>
                                      <td className="p-2">
                                        <button className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                                          onClick={() => removeLocalArtworkCharge(art.tempId, ac.tempId)}>
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
                            </DragDropContext>

                            {/* Quick add links */}
                            <div className="flex items-center gap-4 px-3 py-1.5 text-[10px]">
                              <Button size="xs" variant="outline"
                                onClick={() => addLocalArtworkCharge(art.tempId, {
                                  chargeName: `${art.artworkType || "Imprint"} run charge`,
                                  chargeCategory: "run",
                                  netCost: 0, margin: 0, retailPrice: 0, quantity: 1,
                                  displayMode: "include_in_price",
                                })}
                              >
                                + Run charge
                              </Button>
                              <Button size="xs" variant="outline"
                                onClick={() => addLocalArtworkCharge(art.tempId, {
                                  chargeName: `${art.artworkType || "Setup"} fixed charge`,
                                  chargeCategory: "fixed",
                                  netCost: 0, margin: 0, retailPrice: 0, quantity: 1,
                                  displayMode: "display_to_client",
                                })}
                              >
                                + Fixed charge
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No decorations yet - click "+ Decoration Location" to add imprint locations (front, back, sleeve, etc.)</p>
                )}
              </div>

              {/* ── Summary: Margin breakdown (left) + Subtotal/Tax/Total (right) ── */}
              <div className="flex justify-between items-start gap-4 bg-primary p-6 rounded-lg">
                {/* Left: Margin summary */}
                <div className="bg-white rounded-lg border p-4 space-y-1.5 w-80">
                  <div className="border-b pb-2 mt-2 space-y-1.5">
                    {/* Product layer */}
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-600">
                        <span className="font-medium">Product</span>
                        <span className="font-semibold">{productMarginPercent.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 pl-2">
                        <span>cost ${productCostTotal.toFixed(2)} \u2192 sell ${productSellTotal.toFixed(2)}</span>
                        <span>${(productSellTotal - productCostTotal).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Charges layer */}
                    {(chargeSellTotal > 0 || chargeCostTotal > 0) && (
                      <div>
                        <div className="flex justify-between text-[11px] text-gray-600">
                          <span className="font-medium">Charges</span>
                          <span className="font-semibold">{chargeMarginPercent.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 pl-2">
                          <span>cost ${chargeCostTotal.toFixed(2)} \u2192 sell ${chargeSellTotal.toFixed(2)}</span>
                          <span>${(chargeSellTotal - chargeCostTotal).toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* Decoration layer */}
                    {(decoSellTotal > 0 || decoCostTotal > 0) && (
                      <div>
                        <div className="flex justify-between text-[11px] text-gray-600">
                          <span className="font-medium">Decoration</span>
                          <span className="font-semibold">
                            {decoMarginPercent.toFixed(1)}%
                            {decoMarginPercent < 0 && <span className="ml-1" title="Decoration cost exceeds sell price">\u26A0</span>}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 pl-2">
                          <span>cost ${decoCostTotal.toFixed(2)} \u2192 sell ${decoSellTotal.toFixed(2)}</span>
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

                  {decoMarginPercent < 0 && decoSellTotal > 0 && (
                    <div className="mt-2 pt-2 border-t border-red-200 text-[10px] text-red-700 bg-red-50 -mx-4 -mb-4 px-4 py-2 rounded-b-lg">
                      \u26A0 Decoration is selling at a loss. Cost (${decoCostTotal.toFixed(2)}) exceeds sell price (${decoSellTotal.toFixed(2)}). Check your pricing.
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-semibold">Overall Margin</span>
                    <span className="font-bold">{itemMarginPercent.toFixed(1)}%</span>
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
                        value={taxCodeId || "inherit"}
                        onValueChange={(val) => setTaxCodeId(val === "inherit" ? "" : val)}
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
              Add to Order ${grandTotalWithTax.toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CHARGE DIALOG */}
      <AddEditChargeDialog
        open={showAddCharge}
        editingCharge={editingChargeObj}
        newCharge={newCharge as any}
        setNewCharge={setNewCharge}
        itemId="local"
        addChargeMutation={chargeAddAdapter}
        updateChargeMutation={chargeUpdateAdapter}
        onClose={() => {
          setShowAddCharge(false);
          setEditingChargeIdx(null);
        }}
      />

      {/* ARTWORK FILE PICKER */}
      <FilePickerDialog
        open={pickingArtwork}
        onClose={() => setPickingArtwork(false)}
        onSelect={handleArtworkFilePicked}
        multiple={false}
        contextProjectId={projectId}
        title="Select Artwork File"
      />

      {/* ARTWORK METADATA DIALOG */}
      <Dialog open={!!artPickedFile} onOpenChange={(open) => !open && resetArtForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Artwork Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {artPickedFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={artPickedFile.filePath}
                  alt={artPickedFile.fileName}
                  className="w-16 h-16 object-contain rounded border bg-white"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-sm text-gray-600 truncate flex-1">{artPickedFile.fileName}</p>
              </div>
            )}
            <div>
              <Label>Name</Label>
              <Input value={artUploadName} onChange={(e) => setArtUploadName(e.target.value)} placeholder="e.g., Logo Front" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Decoration Location <span className="text-red-500">*</span></Label>
                <ImprintOptionSelect type="location" value={artUploadLocation} onChange={setArtUploadLocation} />
              </div>
              <div>
                <Label>Imprint Method <span className="text-red-500">*</span></Label>
                <ImprintOptionSelect type="method" value={artUploadMethod} onChange={setArtUploadMethod} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Design Size</Label>
                <Input value={artUploadSize} onChange={(e) => setArtUploadSize(e.target.value)} placeholder='e.g., 3" x 3"' />
              </div>
              <div>
                <Label>Design Color</Label>
                <Input value={artUploadColor} onChange={(e) => setArtUploadColor(e.target.value)} placeholder="e.g., White, PMS 186" />
              </div>
            </div>
            <div>
              <Label>Number of Colors</Label>
              <Input type="number" min={1} max={20} value={artUploadNumberOfColors}
                onChange={(e) => setArtUploadNumberOfColors(parseInt(e.target.value) || 1)} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="config-art-repeat" checked={artUploadRepeatLogo}
                onChange={(e) => setArtUploadRepeatLogo(e.target.checked)} className="rounded border-gray-300" />
              <Label htmlFor="config-art-repeat" className="font-normal text-sm flex items-center gap-1">
                <Repeat className="w-3 h-3 text-purple-500" />
                Repeat logo
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetArtForm}>Cancel</Button>
            <Button
              disabled={!artPickedFile || !artUploadLocation || !artUploadMethod}
              onClick={handleCreateLocalArtwork}
            >
              Add Artwork
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT ARTWORK DIALOG */}
      <EditArtworkDialog
        projectId={projectId}
        artwork={editingLocalArtwork ? {
          ...editingLocalArtwork,
          id: editingLocalArtwork.tempId,
        } : null}
        onClose={() => setEditingLocalArtwork(null)}
        onSave={(_artId: string, updates: Record<string, any>) => {
          if (editingLocalArtwork) {
            updateLocalArtwork(editingLocalArtwork.tempId, {
              name: updates.name,
              location: updates.location || "",
              artworkType: updates.artworkType || "",
              size: updates.size || "",
              color: updates.color || "",
              numberOfColors: updates.numberOfColors || 1,
              repeatLogo: !!updates.repeatLogo,
            });
          }
          setEditingLocalArtwork(null);
        }}
        isSaving={false}
      />

      {/* MATRIX CHARGE PICKER */}
      {matrixPickerTarget && decoratorId && (
        <MatrixChargePicker
          open={true}
          onClose={() => setMatrixPickerTarget(null)}
          supplierId={decoratorId}
          supplierName={suppliers.find((s: any) => s.id === decoratorId)?.name || "Decorator"}
          chargeType={matrixPickerTarget.chargeType}
          artworkId={matrixPickerTarget.artworkTempId}
          chargeId={matrixPickerTarget.chargeTempId}
          chargeName={matrixPickerTarget.chargeName}
          currentMargin={matrixPickerTarget.currentMargin}
          numberOfColors={matrixPickerTarget.numberOfColors}
          quantity={configTotalQty || 1}
          projectId={projectId}
          onApply={(_artTempId, chargeTempId, updates) => {
            // Find which artwork owns this charge
            const art = localArtworks.find(a =>
              a.charges.some(c => c.tempId === chargeTempId)
            );
            if (art) {
              updateLocalArtworkCharge(art.tempId, chargeTempId, {
                netCost: parseFloat(updates.netCost) || 0,
                retailPrice: parseFloat(updates.retailPrice) || 0,
                margin: parseFloat(updates.margin) || 0,
                chargeName: updates.chargeName,
              });
            }
          }}
        />
      )}
    </>
  );
}
