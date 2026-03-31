import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateProjectItem,
  useUpdateLine,
  useDeleteLine,
  useAddLine,
  useAddCharge,
  useUpdateCharge,
  useDeleteCharge,
  useToggleChargeDisplay,
  useCreateArtwork,
  useDeleteArtwork,
  useCreateArtworkCharge,
  useDeleteArtworkCharge,
  useAddArtworkFile,
  useRemoveArtworkFile,
  useCopyArtwork,
  useApplyMatrixPricing,
  useUpdateArtworkCharge,
} from "@/services/project-items";
import * as orderItemRequests from "@/services/project-items/requests";
import { projectKeys } from "@/services/projects/keys";
import type { OrderItemLine, OrderAdditionalCharge } from "@shared/schema";
import {
  useMarginSettings,
  marginColorClass,
  marginBgClass,
  isBelowMinimum,
  calcMarginPercent,
  applyMargin,
} from "@/hooks/useMarginSettings";
import type { ProjectData } from "@/types/project-types";

export function useEditProductPage(projectId: string, itemId: string, data: ProjectData) {
  const marginSettings = useMarginSettings();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { orderItems, allProducts, allArtworkItems, suppliers, allItemLines, allItemCharges, allArtworkCharges } = data;

  // Find the item being edited
  const item = orderItems.find((i: any) => i.id === itemId) || null;

  // Lines & charges from server
  const serverLines: OrderItemLine[] = allItemLines[itemId] || [];
  const charges: OrderAdditionalCharge[] = allItemCharges[itemId] || [];
  const artworks = allArtworkItems[itemId] || [];

  // ── Editable lines (local copy for editing) ──
  const [editableLines, setEditableLines] = useState<any[]>([]);
  const editableLinesRef = useRef(editableLines);
  editableLinesRef.current = editableLines;

  // Sync from server data
  useEffect(() => {
    if (serverLines.length > 0) {
      setEditableLines(serverLines.map(l => ({
        id: l.id,
        isExisting: true,
        orderItemId: l.orderItemId,
        color: l.color || "",
        size: l.size || "",
        quantity: l.quantity || 0,
        cost: parseFloat(l.cost || "0"),
        unitPrice: parseFloat(l.unitPrice || "0"),
      })));
    } else if (item) {
      setEditableLines([{
        id: crypto.randomUUID(),
        isExisting: false,
        orderItemId: itemId,
        color: item.color || "",
        size: item.size || "",
        quantity: item.quantity || 0,
        cost: parseFloat(item.cost || "0"),
        unitPrice: parseFloat(item.unitPrice || "0"),
      }]);
    }
  }, [serverLines, item, itemId]);

  // ── Item-level editable fields ──
  const [editItemData, setEditItemData] = useState<any>({});

  useEffect(() => {
    if (item) {
      setEditItemData({
        description: item.description || "",
        decoratorType: item.decoratorType || "supplier",
        decoratorId: item.decoratorId || "",
        notes: item.notes || "",
        privateNotes: item.privateNotes || "",
        shippingDestination: item.shippingDestination || "",
        shippingAccountType: item.shippingAccountType || "",
        shippingNotes: item.shippingNotes || "",
      });
    }
  }, [item]);

  // ── Price lock (CommonSKU-style: lock retail price, cost changes only affect margin) ──
  const [isPriceLocked, setIsPriceLocked] = useState(false);

  // ── Mutations ──
  const updateOrderItemMutation = useUpdateProjectItem(projectId);
  const updateLineMutation = useUpdateLine(projectId);
  const deleteLineMutation = useDeleteLine(projectId);
  const addLineMutation = useAddLine(projectId);
  const addChargeMutation = useAddCharge(projectId);
  const updateChargeMutation = useUpdateCharge(projectId);
  const deleteChargeMutation = useDeleteCharge(projectId);
  const toggleChargeDisplayMutation = useToggleChargeDisplay(projectId);
  const createArtworkMutation = useCreateArtwork(projectId);
  const deleteArtworkMutation = useDeleteArtwork(projectId);
  const createArtworkChargeMutation = useCreateArtworkCharge(projectId);
  const updateArtworkChargeMutation = useUpdateArtworkCharge(projectId);
  const deleteArtworkChargeMutation = useDeleteArtworkCharge(projectId);
  const addArtworkFileMutation = useAddArtworkFile(projectId);
  const removeArtworkFileMutation = useRemoveArtworkFile(projectId);
  const copyArtworkMutation = useCopyArtwork(projectId);
  const applyMatrixMutation = useApplyMatrixPricing(projectId);

  // ── Line editing helpers ──
  const updateLine = useCallback((id: string, field: string, value: any) => {
    setEditableLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  }, []);

  const updateLineMulti = useCallback((id: string, updates: Record<string, any>) => {
    setEditableLines(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const addLine = () => {
    const lastLine = editableLines[editableLines.length - 1];
    setEditableLines(prev => [...prev, {
      id: crypto.randomUUID(),
      isExisting: false,
      orderItemId: itemId,
      color: "",
      size: "",
      quantity: 1,
      cost: lastLine?.cost || 0,
      unitPrice: lastLine?.unitPrice || 0,
    }]);
  };

  const removeLine = (id: string) => {
    setEditableLines(prev => prev.filter(l => l.id !== id));
  };

  const handleCostChange = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = parseFloat(e.target.value) || 0;
    setEditableLines(prev => {
      // When price is locked, only update cost — margin adjusts naturally
      if (isPriceLocked) {
        return prev.map(l => l.id === id ? { ...l, cost: newCost } : l);
      }
      // Default: preserve margin, adjust price
      const line = prev.find(l => l.id === id);
      if (line && newCost > 0 && line.unitPrice > 0) {
        const currentMargin = calcMarginPercent(line.cost, line.unitPrice);
        if (currentMargin > 0 && currentMargin < 100) {
          const { price } = applyMargin(newCost, 0, currentMargin);
          return prev.map(l => l.id === id ? { ...l, cost: newCost, unitPrice: price } : l);
        }
      }
      return prev.map(l => l.id === id ? { ...l, cost: newCost } : l);
    });
  }, [isPriceLocked]);

  const handleMarginChange = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableLines(prev => {
      const line = prev.find(l => l.id === id);
      if (!line) return prev;
      const targetMargin = parseFloat(e.target.value) || 0;
      const { cost, price } = applyMargin(line.cost, line.unitPrice, targetMargin);
      return prev.map(l => l.id === id ? { ...l, cost, unitPrice: price } : l);
    });
  }, []);

  // ── Computed totals ──
  const lineTotals = editableLines.reduce(
    (acc, l) => ({
      qty: acc.qty + (l.quantity || 0),
      cost: acc.cost + (l.quantity || 0) * (l.cost || 0),
      revenue: acc.revenue + (l.quantity || 0) * (l.unitPrice || 0),
    }),
    { qty: 0, cost: 0, revenue: 0 }
  );

  const totalCharges = charges
    .filter((c: any) => !c.includeInUnitPrice)
    .reduce((s, c) => s + parseFloat(c.amount || "0"), 0);

  const margin = (lineTotals.revenue + totalCharges) > 0
    ? (((lineTotals.revenue + totalCharges) - lineTotals.cost) / (lineTotals.revenue + totalCharges)) * 100
    : 0;

  // ── Dirty check ──
  const hasChanges = useMemo(() => {
    if (!item) return false;

    // Check item-level fields
    if ((editItemData.description || "") !== (item.description || "")) return true;
    if ((editItemData.decoratorType || "supplier") !== (item.decoratorType || "supplier")) return true;
    if ((editItemData.decoratorId || "") !== (item.decoratorId || "")) return true;
    if ((editItemData.notes || "") !== (item.notes || "")) return true;
    if ((editItemData.privateNotes || "") !== (item.privateNotes || "")) return true;

    // Check line count changed
    if (editableLines.length !== serverLines.length) return true;

    // Check if any new (non-existing) lines were added
    if (editableLines.some(l => !l.isExisting)) return true;

    // Check each existing line for value changes
    for (const el of editableLines) {
      if (!el.isExisting) continue;
      const sl = serverLines.find(l => l.id === el.id);
      if (!sl) return true; // line was removed on server
      if (el.color !== (sl.color || "")) return true;
      if (el.size !== (sl.size || "")) return true;
      if (el.quantity !== (sl.quantity || 0)) return true;
      if (Math.abs(el.cost - parseFloat(sl.cost || "0")) > 0.001) return true;
      if (Math.abs(el.unitPrice - parseFloat(sl.unitPrice || "0")) > 0.001) return true;
    }

    return false;
  }, [item, editItemData, editableLines, serverLines]);

  // ── Helpers ──
  const calcMargin = (cost: number, price: number) => price > 0 ? ((price - cost) / price) * 100 : 0;
  const marginColor = (m: number) => marginColorClass(m, marginSettings);
  const marginBg = (m: number) => marginBgClass(m, marginSettings);

  const getItemSupplier = (itm: any) => {
    const currentProduct = allProducts.find((p: any) => p.id === itm.productId);
    const currentSupplierId = currentProduct?.supplierId || itm.supplierId;
    if (itm.supplierName) return { name: itm.supplierName };
    if (currentSupplierId) return suppliers.find((s: any) => s.id === currentSupplierId) || null;
    return null;
  };

  const getProductImage = (itm: any) => {
    const currentProduct = allProducts.find((p: any) => p.id === itm.productId);
    return currentProduct?.imageUrl || null;
  };

  // ── Margin warning ──
  const [marginWarningAction, setMarginWarningAction] = useState<(() => void) | null>(null);
  const [marginWarningValue, setMarginWarningValue] = useState<number>(0);

  const dismissMarginWarning = () => {
    setMarginWarningAction(null);
    setMarginWarningValue(0);
  };

  const confirmMarginWarning = () => {
    if (marginWarningAction) marginWarningAction();
    setMarginWarningAction(null);
    setMarginWarningValue(0);
  };

  // ── Charge dialog ──
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [editingCharge, setEditingCharge] = useState<any>(null); // charge being edited, or null for add mode
  const [newCharge, setNewCharge] = useState({ description: "", chargeType: "flat", chargeCategory: "fixed" as "run" | "fixed", amount: 0, isVendorCharge: false, displayToClient: true, includeInUnitPrice: false });

  // ── Artwork file picker (for adding additional files to existing artwork) ──
  const [addingFileToArtworkId, setAddingFileToArtworkId] = useState<string | null>(null);

  // ── Copy artwork dialog ──
  const [copyingArtworkId, setCopyingArtworkId] = useState<string | null>(null);

  // ── Artwork Charge dialog ──
  const [showAddArtworkCharge, setShowAddArtworkCharge] = useState<string | null>(null); // artworkId or null
  const [newArtworkCharge, setNewArtworkCharge] = useState({
    chargeName: "",
    chargeCategory: "run" as "run" | "fixed",
    netCost: 0,
    margin: 0,
    retailPrice: 0,
    quantity: 1,
    displayMode: "display_to_client" as "include_in_price" | "display_to_client" | "subtract_from_margin",
  });

  // ── Artwork ──
  const [pickingArtwork, setPickingArtwork] = useState(false);
  const [artPickedFile, setArtPickedFile] = useState<{ orderItemId: string; filePath: string; fileName: string } | null>(null);
  const [artUploadName, setArtUploadName] = useState("");
  const [artUploadLocation, setArtUploadLocation] = useState("");
  const [artUploadMethod, setArtUploadMethod] = useState("");
  const [artUploadColor, setArtUploadColor] = useState("");
  const [artUploadSize, setArtUploadSize] = useState("");
  const [artUploadRepeatLogo, setArtUploadRepeatLogo] = useState(false);

  const resetArtForm = () => {
    setArtPickedFile(null);
    setArtUploadName("");
    setArtUploadLocation("");
    setArtUploadMethod("");
    setArtUploadColor("");
    setArtUploadSize("");
    setArtUploadRepeatLogo(false);
  };

  const handleArtworkFilePicked = (files: any[]) => {
    const file = files[0];
    if (file && item) {
      setArtPickedFile({
        orderItemId: itemId,
        filePath: file.cloudinaryUrl,
        fileName: file.originalName || file.fileName,
      });
      setArtUploadName(file.originalName || file.fileName);
      if (item.imprintMethod) setArtUploadMethod(item.imprintMethod);
      if (item.imprintLocation) setArtUploadLocation(item.imprintLocation);
    }
    setPickingArtwork(false);
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
      repeatLogo: artUploadRepeatLogo || undefined,
    }, {
      onSuccess: (newArtwork: any) => {
        resetArtForm();
        // CommonSKU: auto-create default Imprint Cost + Setup Cost charges
        if (newArtwork?.id) {
          const method = artUploadMethod || "";
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

  // ── Save all ──
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (isSaving) return;
    if (isBelowMinimum(margin, marginSettings)) {
      setMarginWarningValue(margin);
      setMarginWarningAction(() => () => saveAll());
      return;
    }
    saveAll();
  };

  const saveAll = async () => {
    if (!item || isSaving) return;
    setIsSaving(true);

    try {
      const totalQty = editableLines.reduce((s, l) => s + (l.quantity || 0), 0);
      const totalRevenue = editableLines.reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0), 0);
      const totalCost = editableLines.reduce((s, l) => s + (l.quantity || 0) * (l.cost || 0), 0);
      const avgPrice = totalQty > 0 ? totalRevenue / totalQty : 0;
      const avgCost = totalQty > 0 ? totalCost / totalQty : 0;

      // 1. Update item-level data
      await orderItemRequests.updateProjectItem(projectId, itemId, {
        description: editItemData.description || null,
        decoratorType: editItemData.decoratorType || "supplier",
        decoratorId: editItemData.decoratorId || null,
        notes: editItemData.notes,
        privateNotes: editItemData.privateNotes || null,
        shippingDestination: editItemData.shippingDestination || null,
        shippingAccountType: editItemData.shippingAccountType || null,
        shippingNotes: editItemData.shippingNotes || null,
        quantity: totalQty,
        cost: avgCost.toFixed(2),
        unitPrice: avgPrice.toFixed(2),
        totalPrice: totalRevenue.toFixed(2),
        color: editableLines.length === 1 ? editableLines[0].color : "",
        size: editableLines.length === 1 ? editableLines[0].size : "",
      });

      // 2. Sync line items
      const existingIds = new Set(serverLines.map(l => l.id));
      const editIds = new Set(editableLines.filter(l => l.isExisting).map(l => l.id));

      // Delete removed lines
      for (const existing of serverLines) {
        if (!editIds.has(existing.id)) {
          await orderItemRequests.deleteLine(existing.orderItemId, existing.id);
        }
      }

      // Update or create lines
      for (const line of editableLines) {
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
          await orderItemRequests.updateLine(line.orderItemId, line.id, lineData);
        } else if (!line.isExisting) {
          await orderItemRequests.addLine(line.orderItemId, lineData);
        }
      }

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: projectKeys.itemsWithDetails(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.itemLines(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.itemCharges(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.artworks(projectId) });

      toast({ title: "Product updated", description: "All changes have been saved." });
      goBack();
    } catch (error) {
      toast({ title: "Failed to save", description: "Something went wrong. Please try again.", variant: "destructive" });
      setIsSaving(false);
    }
  };

  const goBack = () => {
    // Navigate back to the section we came from
    const loc = window.location.pathname;
    if (loc.includes("/quote/edit/")) {
      setLocation(`/projects/${projectId}/quote`);
    } else {
      setLocation(`/projects/${projectId}/sales-order`);
    }
  };

  return {
    item,
    projectId,
    marginSettings,
    // Item data
    editItemData,
    setEditItemData,
    // Lines
    editableLines,
    lineTotals,
    margin,
    totalCharges,
    addLine,
    removeLine,
    updateLine,
    handleCostChange,
    handleMarginChange,
    // Charges
    charges,
    showAddCharge,
    setShowAddCharge,
    newCharge,
    setNewCharge,
    editingCharge,
    setEditingCharge,
    addChargeMutation,
    updateChargeMutation,
    deleteChargeMutation,
    toggleChargeDisplayMutation,
    // Artwork
    artworks,
    allArtworkCharges,
    suppliers,
    pickingArtwork,
    setPickingArtwork,
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
    artUploadRepeatLogo,
    setArtUploadRepeatLogo,
    resetArtForm,
    handleArtworkFilePicked,
    handleCreateArtwork,
    createArtworkMutation,
    deleteArtworkMutation,
    // Artwork charges
    showAddArtworkCharge,
    setShowAddArtworkCharge,
    newArtworkCharge,
    setNewArtworkCharge,
    createArtworkChargeMutation,
    updateArtworkChargeMutation,
    deleteArtworkChargeMutation,
    applyMatrixMutation,
    // Artwork files & copy
    addArtworkFileMutation,
    removeArtworkFileMutation,
    copyArtworkMutation,
    addingFileToArtworkId,
    setAddingFileToArtworkId,
    copyingArtworkId,
    setCopyingArtworkId,
    allArtworkFiles: data.allArtworkFiles || {},
    orderItems,
    // Margin warning
    marginWarningAction,
    marginWarningValue,
    dismissMarginWarning,
    confirmMarginWarning,
    // Helpers
    getItemSupplier,
    getProductImage,
    calcMargin,
    marginColor,
    marginBg,
    // Price lock
    isPriceLocked,
    setIsPriceLocked,
    // Actions
    handleSave,
    goBack,
    isSaving,
    hasChanges,
    itemId,
  };
}
