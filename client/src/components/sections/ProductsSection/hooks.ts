import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteProjectItem,
  useUpdateProjectItem,
  useUpdateLine,
  useDeleteLine,
  useAddLine,
  useAddCharge,
  useDeleteCharge,
  useToggleChargeDisplay,
  useCreateArtwork,
  useDeleteArtwork,
} from "@/services/project-items";
import * as orderItemRequests from "@/services/project-items/requests";
import { projectKeys } from "@/services/projects/keys";
import type { OrderItemLine, OrderAdditionalCharge } from "@shared/schema";
import { useMarginSettings, marginColorClass, marginBgClass, isBelowMinimum, calcMarginPercent, applyMargin } from "@/hooks/useMarginSettings";
import type { ProductsSectionProps } from "./types";

export function useProductsSection({ projectId, data, isLocked }: ProductsSectionProps) {
  const marginSettings = useMarginSettings();
  const [currentLocation] = useLocation();
  const isQuoteContext = currentLocation.includes("/quote");
  const addProductPath = isQuoteContext
    ? `/projects/${projectId}/quote/add`
    : `/projects/${projectId}/sales-order/add`;
  const {
    orderItems, allProducts, allArtworkItems, suppliers,
    allItemLines, allItemCharges,
  } = data;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Inline line editing state
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [editLineData, setEditLineData] = useState<Partial<OrderItemLine>>({});

  // Edit item dialog state
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editItemData, setEditItemData] = useState<any>({});

  // Add charge dialog state
  const [addChargeForItem, setAddChargeForItem] = useState<string | null>(null);
  const [newCharge, setNewCharge] = useState({ description: "", chargeType: "flat", amount: 0, isVendorCharge: false, displayToClient: true });

  // Margin warning state
  const [marginWarningAction, setMarginWarningAction] = useState<(() => void) | null>(null);
  const [marginWarningValue, setMarginWarningValue] = useState<number>(0);

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
  const updateOrderItemMutation = useUpdateProjectItem(projectId);
  const updateLineMutation = useUpdateLine(projectId);
  const deleteLineMutation = useDeleteLine(projectId);
  const addLineMutation = useAddLine(projectId);
  const addChargeMutation = useAddCharge(projectId);
  const deleteChargeMutation = useDeleteCharge(projectId);
  const toggleChargeDisplayMutation = useToggleChargeDisplay(projectId);
  const createArtworkMutation = useCreateArtwork(projectId);
  const deleteArtworkMutation = useDeleteArtwork(projectId);

  // ── Helpers ──

  const getItemSupplier = (item: any) => {
    const currentProduct = allProducts.find((p: any) => p.id === item.productId);
    const currentSupplierId = currentProduct?.supplierId || item.supplierId;
    if (item.supplierName) return { name: item.supplierName };
    if (currentSupplierId) return suppliers.find((s: any) => s.id === currentSupplierId) || null;
    return null;
  };

  const getProductImage = (item: any) => {
    const currentProduct = allProducts.find((p: any) => p.id === item.productId);
    return currentProduct?.imageUrl || null;
  };

  const getArtworkCount = (itemId: string): number => allArtworkItems[itemId]?.length || 0;

  const calcMargin = (cost: number, price: number) => price > 0 ? ((price - cost) / price) * 100 : 0;

  const marginColor = (m: number) => marginColorClass(m, marginSettings);
  const marginBg = (m: number) => marginBgClass(m, marginSettings);

  // Calculate item-level totals using lines if available
  const getItemTotals = (item: any) => {
    const lines: OrderItemLine[] = allItemLines[item.id] || [];
    const charges: OrderAdditionalCharge[] = allItemCharges[item.id] || [];

    let totalQty = 0;
    let totalCost = 0;
    let totalRevenue = 0;

    if (lines.length > 0) {
      lines.forEach(l => {
        const qty = l.quantity || 0;
        const cost = parseFloat(l.cost || "0");
        const price = parseFloat(l.unitPrice || "0");
        totalQty += qty;
        totalCost += qty * cost;
        totalRevenue += qty * price;
      });
    } else {
      totalQty = item.quantity || 0;
      totalCost = totalQty * (parseFloat(item.cost || "0"));
      totalRevenue = totalQty * (parseFloat(item.unitPrice || "0"));
    }

    const totalCharges = charges.reduce((s, c) => s + parseFloat(c.amount || "0"), 0);
    const margin = (totalRevenue + totalCharges) > 0
      ? (((totalRevenue + totalCharges) - totalCost) / (totalRevenue + totalCharges)) * 100
      : 0;

    return { totalQty, totalCost, totalRevenue, totalCharges, margin };
  };

  // Order-level totals
  const orderTotals = orderItems.reduce(
    (acc: { subtotal: number; totalCost: number; totalQty: number; totalCharges: number }, item: any) => {
      const t = getItemTotals(item);
      return {
        subtotal: acc.subtotal + t.totalRevenue,
        totalCost: acc.totalCost + t.totalCost,
        totalQty: acc.totalQty + t.totalQty,
        totalCharges: acc.totalCharges + t.totalCharges,
      };
    },
    { subtotal: 0, totalCost: 0, totalQty: 0, totalCharges: 0 },
  );
  const orderMargin = (orderTotals.subtotal + orderTotals.totalCharges) > 0
    ? (((orderTotals.subtotal + orderTotals.totalCharges - orderTotals.totalCost) / (orderTotals.subtotal + orderTotals.totalCharges)) * 100)
    : 0;

  // Edit item dialog lines (local copy for editing)
  const [editDialogLines, setEditDialogLines] = useState<any[]>([]);

  // Start editing an item - load its lines into the dialog
  const startEditItem = (item: any) => {
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

  const updateEditDialogLine = (id: string, field: string, value: any) => {
    setEditDialogLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const updateEditDialogLineMulti = (id: string, updates: Record<string, any>) => {
    setEditDialogLines(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeEditDialogLine = (id: string) => {
    setEditDialogLines(prev => prev.filter(l => l.id !== id));
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

    // Update or create lines
    for (const line of editDialogLines) {
      const m = line.unitPrice > 0 ? ((line.unitPrice - line.cost) / line.unitPrice * 100) : 0;
      const lineData = {
        color: line.color,
        size: line.size,
        quantity: line.quantity,
        cost: line.cost.toFixed(2),
        unitPrice: line.unitPrice.toFixed(2),
        totalPrice: (line.quantity * line.unitPrice).toFixed(2),
        margin: m.toFixed(2),
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
    const price = parseFloat(editLineData.unitPrice as string || "0");
    const cost = parseFloat(editLineData.cost as string || "0");
    const m = calcMargin(cost, price);
    if (isBelowMinimum(m, marginSettings)) {
      setMarginWarningValue(m);
      setMarginWarningAction(() => () => saveEditLine(line));
      return;
    }
    saveEditLine(line);
  };

  const saveEditLine = (line: OrderItemLine) => {
    const qty = editLineData.quantity || 0;
    const price = parseFloat(editLineData.unitPrice as string || "0");
    const cost = parseFloat(editLineData.cost as string || "0");
    const m = calcMargin(cost, price);

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
  const handleArtworkFilePicked = (files: any[]) => {
    const file = files[0];
    if (file && pickingArtworkForItem) {
      const item = orderItems.find((i: any) => i.id === pickingArtworkForItem);
      setArtPickedFile({
        orderItemId: pickingArtworkForItem,
        filePath: file.cloudinaryUrl,
        fileName: file.originalName || file.fileName,
      });
      setArtUploadName(file.originalName || file.fileName);
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
    }, { onSuccess: () => resetArtForm() });
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
    const line = editDialogLines.find((l: any) => l.id === lineId);
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
    const line = editDialogLines.find((l: any) => l.id === lineId);
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
    orderItems,
    allProducts,
    allArtworkItems,
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
    calcMargin,
    marginColor,
    marginBg,
    orderTotals,
    orderMargin,
    projectId,
  };
}
