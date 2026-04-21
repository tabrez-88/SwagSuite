import { useState } from "react";
import { useLocation } from "@/lib/wouter-compat";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import {
  useDeleteProjectItem,
  useDuplicateProjectItem,
  useReorderProjectItems,
  useReorderLines,
  useUpdateProjectItem,
  useUpdateLine,
  useDeleteLine,
  useAddLine,
  useAddCharge,
  useDeleteCharge,
  useToggleChargeDisplay,
  useCreateArtwork,
  useDeleteArtwork,
  useCreateArtworkCharge,
} from "@/services/project-items";
import * as orderItemRequests from "@/services/project-items/requests";
import { projectKeys } from "@/services/projects/keys";
import type { OrderItemLine, OrderAdditionalCharge } from "@shared/schema";
import type { EnrichedOrderItem } from "@/types/project-types";
import { useMarginSettings, marginColorClass, marginBgClass, isBelowMinimum, calcMarginPercent, applyMargin } from "@/hooks/useMarginSettings";
import {
  getItemPricing,
  type PricingLine,
  type ProductCharge,
  type DecorationCharge,
  type ItemPricingBreakdown,
} from "@/lib/pricing";
import type { ProductsSectionProps } from "./types";

export function useProductsSection({ projectId, data, isLocked }: ProductsSectionProps) {
  const marginSettings = useMarginSettings();
  const { data: taxCodes } = useQuery<Array<{ id: string; rate: string }>>({
    queryKey: ["/api/tax-codes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  // Fetch order-level service charges (for shipping margin display)
  const { data: serviceCharges = [] } = useQuery<any[]>({
    queryKey: projectKeys.serviceCharges(projectId),
    queryFn: getQueryFn({ on401: "throw" }),
  });
  const [currentLocation] = useLocation();
  const isQuoteContext = currentLocation.includes("/quote");
  const addProductPath = isQuoteContext
    ? `/projects/${projectId}/quote/add`
    : `/projects/${projectId}/sales-order/add`;
  const {
    orderItems, allProducts, allArtworkItems, suppliers,
    allItemLines, allItemCharges, allArtworkCharges, order,
  } = data;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [deletingProduct, setDeletingProduct] = useState<EnrichedOrderItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Inline line editing state
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [editLineData, setEditLineData] = useState<Partial<OrderItemLine>>({});

  // Edit item dialog state
  const [editingItem, setEditingItem] = useState<EnrichedOrderItem | null>(null);
  const [editItemData, setEditItemData] = useState<Record<string, string>>({});

  // Add charge dialog state
  const [addChargeForItem, setAddChargeForItem] = useState<string | null>(null);
  const [newCharge, setNewCharge] = useState({ description: "", chargeType: "flat", amount: 0, isVendorCharge: false, displayToClient: true });

  // Margin warning state
  const [marginWarningAction, setMarginWarningAction] = useState<(() => void) | null>(null);
  const [marginWarningValue, setMarginWarningValue] = useState<number>(0);

  // Artwork preview state
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);

  // Artwork upload state
  const [pickingArtworkForItem, setPickingArtworkForItem] = useState<string | null>(null);
  const [artPickedFile, setArtPickedFile] = useState<{ orderItemId: string; filePath: string; fileName: string } | null>(null);
  const [artUploadName, setArtUploadName] = useState("");
  const [artUploadLocation, setArtUploadLocation] = useState("");
  const [artUploadMethod, setArtUploadMethod] = useState("");
  const [artUploadColor, setArtUploadColor] = useState("");
  const [artUploadSize, setArtUploadSize] = useState("");

  const resetArtForm = () => {
    setArtPickedFile(null);
    setArtUploadName("");
    setArtUploadLocation("");
    setArtUploadMethod("");
    setArtUploadColor("");
    setArtUploadSize("");
  };

  // Toggle expand/collapse
  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  // ── Service mutations ──
  const deleteOrderItemMutation = useDeleteProjectItem(projectId);
  const duplicateOrderItemMutation = useDuplicateProjectItem(projectId);
  const updateOrderItemMutation = useUpdateProjectItem(projectId);
  const updateLineMutation = useUpdateLine(projectId);
  const deleteLineMutation = useDeleteLine(projectId);
  const addLineMutation = useAddLine(projectId);
  const addChargeMutation = useAddCharge(projectId);
  const deleteChargeMutation = useDeleteCharge(projectId);
  const toggleChargeDisplayMutation = useToggleChargeDisplay(projectId);
  const createArtworkMutation = useCreateArtwork(projectId);
  const deleteArtworkMutation = useDeleteArtwork(projectId);
  const createArtworkChargeMutation = useCreateArtworkCharge(projectId);
  const reorderItemsMutation = useReorderProjectItems(projectId);
  const reorderLinesMutation = useReorderLines(projectId);

  // Sort items by sortOrder
  const sortedOrderItems = [...orderItems].sort((a, b) => {
    const sa = (a as any).sortOrder ?? 0;
    const sb = (b as any).sortOrder ?? 0;
    return sa - sb;
  });

  // ── Helpers ──

  const getItemSupplier = (item: EnrichedOrderItem) => {
    const currentProduct = allProducts.find((p) => p.id === item.productId);
    const currentSupplierId = currentProduct?.supplierId || item.supplierId;
    if (item.supplierName) return { name: item.supplierName };
    if (currentSupplierId) return suppliers.find((s) => s.id === currentSupplierId) || null;
    return null;
  };

  const getProductImage = (item: EnrichedOrderItem) => {
    const currentProduct = allProducts.find((p) => p.id === item.productId);
    return currentProduct?.imageUrl || null;
  };

  const getArtworkCount = (itemId: string): number => allArtworkItems[itemId]?.length || 0;

  const marginColor = (m: number) => marginColorClass(m, marginSettings);
  const marginBg = (m: number) => marginBgClass(m, marginSettings);

  // ── Item-level pricing (shared utility) ──

  /** Collect all artwork/decoration charges for an item (flatten artwork→charges) */
  const getItemDecoCharges = (itemId: string): DecorationCharge[] => {
    const artworks = allArtworkItems[itemId] || [];
    const decoCharges: DecorationCharge[] = [];
    for (const art of artworks) {
      const charges = allArtworkCharges[art.id] || [];
      for (const c of charges) {
        decoCharges.push(c as DecorationCharge);
      }
    }
    return decoCharges;
  };

  /** Get full pricing breakdown for an item using shared pricing utility */
  const getItemTotals = (item: EnrichedOrderItem): ItemPricingBreakdown & { taxRate: number; taxAmount: number; grandTotalWithTax: number } => {
    const lines = (allItemLines[item.id] || []).map((l: OrderItemLine): PricingLine => ({
      quantity: l.quantity || 0,
      cost: parseFloat(l.cost || "0"),
      unitPrice: parseFloat(l.unitPrice || "0"),
    }));
    const charges = (allItemCharges[item.id] || []) as ProductCharge[];
    const decoCharges = getItemDecoCharges(item.id);

    const pricing = getItemPricing(lines, charges, decoCharges, item);

    // Tax: resolve from item's taxCodeId, falling back to order-level defaultTaxCodeId
    const effectiveTaxCodeId = item.taxCodeId || (order as any)?.defaultTaxCodeId;
    const itemTaxCode = effectiveTaxCodeId
      ? (taxCodes || []).find((tc) => tc.id === effectiveTaxCodeId)
      : null;
    const taxRate = itemTaxCode ? parseFloat(itemTaxCode.rate || "0") : 0;
    const taxAmount = pricing.itemSellGrandTotal * (taxRate / 100);
    const grandTotalWithTax = pricing.itemSellGrandTotal + taxAmount;

    return { ...pricing, taxRate, taxAmount, grandTotalWithTax };
  };

  // ── Order-level totals ──
  const orderTotals = orderItems.reduce(
    (acc, item) => {
      const p = getItemTotals(item);
      return {
        orderProductSell: acc.orderProductSell + p.productSellTotal,
        orderChargeSell: acc.orderChargeSell + p.chargeSellTotal,
        orderDecoSell: acc.orderDecoSell + p.decoSellTotal,
        orderCostTotal: acc.orderCostTotal + p.itemCostGrandTotal,
        orderQtyTotal: acc.orderQtyTotal + p.totalQty,
        // Backward-compat aliases for existing UI
        subtotal: acc.subtotal + p.productSellTotal,
        totalCost: acc.totalCost + p.itemCostGrandTotal,
        totalQty: acc.totalQty + p.totalQty,
        totalCharges: acc.totalCharges + p.chargeSellTotal + p.decoSellTotal,
      };
    },
    {
      orderProductSell: 0, orderChargeSell: 0, orderDecoSell: 0,
      orderCostTotal: 0, orderQtyTotal: 0,
      subtotal: 0, totalCost: 0, totalQty: 0, totalCharges: 0,
    },
  );
  const orderSellGrandTotal = orderTotals.orderProductSell + orderTotals.orderChargeSell + orderTotals.orderDecoSell;

  // Shipping freight from service charges (auto-created by shipping account type sync)
  const freightCharges = serviceCharges.filter((c: any) => c.chargeType === "freight" && c.notes?.startsWith("auto:shipping:"));
  const shippingTotals = {
    cost: freightCharges.reduce((sum: number, c: any) => sum + (c.quantity || 1) * parseFloat(c.unitCost || "0"), 0),
    revenue: freightCharges.reduce((sum: number, c: any) => sum + (c.quantity || 1) * parseFloat(c.unitPrice || "0"), 0),
  };
  const margin = orderSellGrandTotal > 0
    ? ((orderSellGrandTotal - orderTotals.orderCostTotal) / orderSellGrandTotal) * 100
    : 0;

  // Edit item dialog lines (local copy for editing)
  const [editDialogLines, setEditDialogLines] = useState<Array<{ id: string; isExisting: boolean; color: string; size: string; quantity: number; cost: number; unitPrice: number }>>([]);

  // Start editing an item - load its lines into the dialog
  const startEditItem = (item: EnrichedOrderItem) => {
    setEditingItem(item);
    const itemLines: OrderItemLine[] = allItemLines[item.id] || [];
    setEditItemData({
      imprintMethod: item.imprintMethod || "",
      imprintLocation: item.imprintLocation || "",
      notes: item.notes || "",
      shippingDestination: item.shippingDestination || "",
      shippingAccountType: item.shippingAccountType || "",
      shippingNotes: item.shippingNotes || "",
    });
    // Copy lines for local editing
    if (itemLines.length > 0) {
      setEditDialogLines(itemLines.map(l => ({
        id: l.id,
        isExisting: true,
        color: l.color || "",
        size: l.size || "",
        quantity: l.quantity || 0,
        cost: parseFloat(l.cost || "0"),
        unitPrice: parseFloat(l.unitPrice || "0"),
      })));
    } else {
      // If no lines, create one from item-level data
      setEditDialogLines([{
        id: crypto.randomUUID(),
        isExisting: false,
        color: item.color || "",
        size: item.size || "",
        quantity: item.quantity || 0,
        cost: parseFloat(item.cost || "0"),
        unitPrice: parseFloat(item.unitPrice || "0"),
      }]);
    }
  };

  const addEditDialogLine = () => {
    const lastLine = editDialogLines[editDialogLines.length - 1];
    setEditDialogLines(prev => [...prev, {
      id: crypto.randomUUID(),
      isExisting: false,
      color: "",
      size: "",
      quantity: 1,
      cost: lastLine?.cost || 0,
      unitPrice: lastLine?.unitPrice || 0,
    }]);
  };

  const updateEditDialogLine = (id: string, field: string, value: unknown) => {
    setEditDialogLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const updateEditDialogLineMulti = (id: string, updates: Record<string, unknown>) => {
    setEditDialogLines(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeEditDialogLine = (id: string) => {
    setEditDialogLines(prev => prev.filter(l => l.id !== id));
  };

  const reorderEditDialogLines = (sourceIndex: number, destIndex: number) => {
    setEditDialogLines(prev => {
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(destIndex, 0, moved);
      return next;
    });
  };

  // Computed totals for the edit dialog
  const editDialogTotals = editDialogLines.reduce(
    (acc, l) => ({
      qty: acc.qty + (l.quantity || 0),
      cost: acc.cost + (l.quantity || 0) * (l.cost || 0),
      revenue: acc.revenue + (l.quantity || 0) * (l.unitPrice || 0),
    }),
    { qty: 0, cost: 0, revenue: 0 }
  );
  const editDialogMargin = editDialogTotals.revenue > 0
    ? ((editDialogTotals.revenue - editDialogTotals.cost) / editDialogTotals.revenue * 100) : 0;

  const handleSaveEditItem = () => {
    if (!editingItem) return;
    if (isBelowMinimum(editDialogMargin, marginSettings)) {
      setMarginWarningValue(editDialogMargin);
      setMarginWarningAction(() => () => saveEditItem());
      return;
    }
    saveEditItem();
  };

  const saveEditItem = async () => {
    if (!editingItem) return;

    // 1. Update the item-level data (imprint, notes)
    const totalQty = editDialogLines.reduce((s, l) => s + (l.quantity || 0), 0);
    const totalRevenue = editDialogLines.reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0), 0);
    const totalCost = editDialogLines.reduce((s, l) => s + (l.quantity || 0) * (l.cost || 0), 0);
    const avgPrice = totalQty > 0 ? totalRevenue / totalQty : 0;
    const avgCost = totalQty > 0 ? totalCost / totalQty : 0;

    await orderItemRequests.updateProjectItem(projectId, editingItem.id, {
      imprintMethod: editItemData.imprintMethod,
      imprintLocation: editItemData.imprintLocation,
      notes: editItemData.notes,
      shippingDestination: editItemData.shippingDestination || null,
      shippingAccountType: editItemData.shippingAccountType || null,
      shippingNotes: editItemData.shippingNotes || null,
      quantity: totalQty,
      cost: avgCost.toFixed(2),
      unitPrice: avgPrice.toFixed(2),
      totalPrice: totalRevenue.toFixed(2),
      color: editDialogLines.length === 1 ? editDialogLines[0].color : "",
      size: editDialogLines.length === 1 ? editDialogLines[0].size : "",
    });

    // 2. Sync line items: delete removed, update existing, create new
    const existingLines: OrderItemLine[] = allItemLines[editingItem.id] || [];
    const existingIds = new Set(existingLines.map(l => l.id));
    const editIds = new Set(editDialogLines.filter(l => l.isExisting).map(l => l.id));

    // Delete lines that were removed
    for (const existing of existingLines) {
      if (!editIds.has(existing.id)) {
        await orderItemRequests.deleteLine(editingItem.id, existing.id);
      }
    }

    // Update or create lines (with sortOrder)
    const createdLineIds: string[] = [];
    for (let i = 0; i < editDialogLines.length; i++) {
      const line = editDialogLines[i];
      const m = line.unitPrice > 0 ? ((line.unitPrice - line.cost) / line.unitPrice * 100) : 0;
      const lineData = {
        color: line.color,
        size: line.size,
        quantity: line.quantity,
        cost: line.cost.toFixed(2),
        unitPrice: line.unitPrice.toFixed(2),
        totalPrice: (line.quantity * line.unitPrice).toFixed(2),
        margin: m.toFixed(2),
        sortOrder: i,
      };

      if (line.isExisting && existingIds.has(line.id)) {
        await orderItemRequests.updateLine(editingItem.id, line.id, lineData);
      } else if (!line.isExisting) {
        await orderItemRequests.addLine(editingItem.id, lineData);
      }
    }

    // Invalidate all order item caches
    queryClient.invalidateQueries({ queryKey: projectKeys.itemsWithDetails(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.itemLines(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.itemCharges(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.artworks(projectId) });
    setEditingItem(null);
    toast({ title: "Product updated", description: "All changes have been saved." });
  };

  // Start editing a line
  const startEditLine = (line: OrderItemLine) => {
    setEditingLine(line.id);
    setEditLineData({
      quantity: line.quantity,
      cost: line.cost,
      unitPrice: line.unitPrice,
      color: line.color,
      size: line.size,
    });
  };

  const handleSaveEditLine = (line: OrderItemLine) => {
    saveEditLine(line);
  };

  const saveEditLine = (line: OrderItemLine) => {
    const qty = editLineData.quantity || 0;
    const price = parseFloat(editLineData.unitPrice as string || "0");
    const cost = parseFloat(editLineData.cost as string || "0");
    const m = calcMarginPercent(cost, price);

    updateLineMutation.mutate({
      lineId: line.id,
      orderItemId: line.orderItemId,
      updates: {
        quantity: qty,
        cost: cost.toFixed(2),
        unitPrice: price.toFixed(2),
        totalPrice: (qty * price).toFixed(2),
        margin: m.toFixed(2),
        color: editLineData.color,
        size: editLineData.size,
      },
    }, { onSuccess: () => setEditingLine(null) });
  };

  // Handle artwork file picker selection
  const handleArtworkFilePicked = (files: Array<{ cloudinaryUrl: string; originalName?: string; fileName?: string }>) => {
    const file = files[0];
    if (file && pickingArtworkForItem) {
      const item = orderItems.find((i) => i.id === pickingArtworkForItem);
      setArtPickedFile({
        orderItemId: pickingArtworkForItem,
        filePath: file.cloudinaryUrl,
        fileName: file.originalName || file.fileName || "",
      });
      setArtUploadName(file.originalName || file.fileName || "");
      if (item?.imprintMethod) setArtUploadMethod(item.imprintMethod);
      if (item?.imprintLocation) setArtUploadLocation(item.imprintLocation);
    }
    setPickingArtworkForItem(null);
  };

  const handleCreateArtwork = () => {
    if (!artPickedFile) return;
    createArtworkMutation.mutate({
      orderItemId: artPickedFile.orderItemId,
      name: artUploadName || artPickedFile.fileName,
      filePath: artPickedFile.filePath,
      fileName: artPickedFile.fileName,
      location: artUploadLocation || undefined,
      artworkType: artUploadMethod || undefined,
      color: artUploadColor || undefined,
      size: artUploadSize || undefined,
    }, {
      onSuccess: (newArtwork: { id: string }) => {
        const method = artUploadMethod || "";
        resetArtForm();
        // CommonSKU: auto-create default Imprint Cost (run) + Setup Cost (fixed) charges
        if (newArtwork?.id) {
          createArtworkChargeMutation.mutate({
            artworkId: newArtwork.id,
            charge: {
              chargeName: method ? `${method} imprint` : "Imprint Cost",
              chargeCategory: "run",
              netCost: "0",
              margin: "0",
              retailPrice: "0",
              quantity: 1,
              displayMode: "include_in_price",
            },
          }, {
            onSuccess: () => {
              createArtworkChargeMutation.mutate({
                artworkId: newArtwork.id,
                charge: {
                  chargeName: method ? `${method} setup` : "Setup Cost",
                  chargeCategory: "fixed",
                  netCost: "0",
                  margin: "0",
                  retailPrice: "0",
                  quantity: 1,
                  displayMode: "display_to_client",
                },
              });
            },
          });
        }
      },
    });
  };

  const dismissMarginWarning = () => {
    setMarginWarningAction(null);
    setMarginWarningValue(0);
  };

  const confirmMarginWarning = () => {
    if (marginWarningAction) marginWarningAction();
    setMarginWarningAction(null);
    setMarginWarningValue(0);
  };

  const handleEditDialogCostChange = (lineId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = parseFloat(e.target.value) || 0;
    const line = editDialogLines.find((l) => l.id === lineId);
    if (line && newCost > 0 && line.unitPrice > 0) {
      const currentMargin = calcMarginPercent(line.cost, line.unitPrice);
      if (currentMargin > 0 && currentMargin < 100) {
        const { price } = applyMargin(newCost, 0, currentMargin);
        updateEditDialogLineMulti(lineId, { cost: newCost, unitPrice: price });
        return;
      }
    }
    updateEditDialogLine(lineId, "cost", newCost);
  };

  const handleEditDialogMarginChange = (lineId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const line = editDialogLines.find((l) => l.id === lineId);
    if (!line) return;
    const targetMargin = parseFloat(e.target.value) || 0;
    const result = applyMargin(line.cost, line.unitPrice, targetMargin);
    updateEditDialogLineMulti(lineId, { cost: result.cost, unitPrice: result.price });
  };

  return {
    // Settings
    marginSettings,
    // Navigation
    addProductPath,
    setLocation,
    // Data
    orderItems: sortedOrderItems,
    allProducts,
    allArtworkItems,
    allArtworkCharges,
    allItemLines,
    allItemCharges,
    suppliers,
    // UI state
    expandedItems,
    toggleExpand,
    isLocked,
    // Delete
    deletingProduct,
    setDeletingProduct,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteOrderItemMutation,
    duplicateOrderItemMutation,
    reorderItemsMutation,
    reorderLinesMutation,
    // Edit line inline
    editingLine,
    setEditingLine,
    editLineData,
    setEditLineData,
    startEditLine,
    handleSaveEditLine,
    updateLineMutation,
    // Edit item dialog
    editingItem,
    setEditingItem,
    editItemData,
    setEditItemData,
    startEditItem,
    handleSaveEditItem,
    updateOrderItemMutation,
    editDialogLines,
    editDialogTotals,
    editDialogMargin,
    addEditDialogLine,
    updateEditDialogLine,
    removeEditDialogLine,
    reorderEditDialogLines,
    handleEditDialogCostChange,
    handleEditDialogMarginChange,
    // Charges
    addChargeForItem,
    setAddChargeForItem,
    newCharge,
    setNewCharge,
    addChargeMutation,
    deleteChargeMutation,
    toggleChargeDisplayMutation,
    // Lines
    addLineMutation,
    deleteLineMutation,
    // Artwork preview
    previewFile,
    setPreviewFile,
    // Artwork
    pickingArtworkForItem,
    setPickingArtworkForItem,
    artPickedFile,
    artUploadName,
    setArtUploadName,
    artUploadLocation,
    setArtUploadLocation,
    artUploadMethod,
    setArtUploadMethod,
    artUploadColor,
    setArtUploadColor,
    artUploadSize,
    setArtUploadSize,
    resetArtForm,
    handleArtworkFilePicked,
    handleCreateArtwork,
    createArtworkMutation,
    deleteArtworkMutation,
    // Margin warning
    marginWarningAction,
    marginWarningValue,
    dismissMarginWarning,
    confirmMarginWarning,
    // Helpers
    getItemSupplier,
    getProductImage,
    getArtworkCount,
    getItemTotals,
    marginColor,
    marginBg,
    orderTotals,
    shippingTotals,
    margin,
    projectId,
    data,
  };
}
