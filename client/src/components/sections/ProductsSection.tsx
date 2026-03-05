import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectData } from "@/types/project-types";
import type { OrderItemLine, OrderAdditionalCharge } from "@shared/schema";

interface ProductsSectionProps {
  orderId: string;
  data: ProjectData;
}

export default function ProductsSection({ orderId, data }: ProductsSectionProps) {
  // Detect context: project vs order
  const [currentLocation] = useLocation();
  const isProjectContext = currentLocation.startsWith(`/project/`);
  const addProductPath = isProjectContext
    ? `/project/${orderId}/sales-order/add`
    : `/orders/${orderId}/products/add`;
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
  const [newCharge, setNewCharge] = useState({ description: "", chargeType: "flat", amount: 0, isVendorCharge: false });

  // Artwork upload state
  const [uploadingArtworkForItem, setUploadingArtworkForItem] = useState<string | null>(null);

  // Toggle expand/collapse
  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  // ── Mutations ──

  const deleteOrderItemMutation = useMutation({
    mutationFn: async (orderItemId: string) => {
      const response = await fetch(`/api/orders/${orderId}/items/${orderItemId}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Failed to delete order item");
    },
    onSuccess: () => {
      invalidateAll();
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      toast({ title: "Item removed", description: "Product has been removed from this order." });
    },
    onError: () => {
      setIsDeleteDialogOpen(false);
      toast({ title: "Failed to remove item", variant: "destructive" });
    },
  });

  const updateOrderItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: any }) => {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update order item");
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setEditingItem(null);
      toast({ title: "Item updated", description: "Product details have been saved." });
    },
    onError: () => toast({ title: "Failed to update item", variant: "destructive" }),
  });

  const updateLineMutation = useMutation({
    mutationFn: async ({ lineId, orderItemId, updates }: { lineId: string; orderItemId: string; updates: any }) => {
      const res = await fetch(`/api/order-items/${orderItemId}/lines/${lineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update line");
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setEditingLine(null);
      toast({ title: "Line updated" });
    },
    onError: () => toast({ title: "Failed to update line", variant: "destructive" }),
  });

  const deleteLineMutation = useMutation({
    mutationFn: async ({ lineId, orderItemId }: { lineId: string; orderItemId: string }) => {
      const res = await fetch(`/api/order-items/${orderItemId}/lines/${lineId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete line");
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Line removed" });
    },
    onError: () => toast({ title: "Failed to remove line", variant: "destructive" }),
  });

  const addChargeMutation = useMutation({
    mutationFn: async ({ orderItemId, charge }: { orderItemId: string; charge: any }) => {
      const res = await fetch(`/api/order-items/${orderItemId}/charges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...charge, orderItemId }),
      });
      if (!res.ok) throw new Error("Failed to add charge");
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setAddChargeForItem(null);
      setNewCharge({ description: "", chargeType: "flat", amount: 0, isVendorCharge: false });
      toast({ title: "Charge added" });
    },
    onError: () => toast({ title: "Failed to add charge", variant: "destructive" }),
  });

  const deleteChargeMutation = useMutation({
    mutationFn: async ({ chargeId, orderItemId }: { chargeId: string; orderItemId: string }) => {
      const res = await fetch(`/api/order-items/${orderItemId}/charges/${chargeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete charge");
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Charge removed" });
    },
    onError: () => toast({ title: "Failed to remove charge", variant: "destructive" }),
  });

  const addLineMutation = useMutation({
    mutationFn: async ({ orderItemId, line }: { orderItemId: string; line: any }) => {
      const res = await fetch(`/api/order-items/${orderItemId}/lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...line, orderItemId }),
      });
      if (!res.ok) throw new Error("Failed to add line");
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Line added" });
    },
    onError: () => toast({ title: "Failed to add line", variant: "destructive" }),
  });

  const uploadArtworkMutation = useMutation({
    mutationFn: async ({ orderItemId, file, name, location, artworkType }: { orderItemId: string; file: File; name: string; location?: string; artworkType?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      if (location) formData.append("location", location);
      if (artworkType) formData.append("artworkType", artworkType);
      const res = await fetch(`/api/order-items/${orderItemId}/artworks`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload artwork");
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setUploadingArtworkForItem(null);
      toast({ title: "Artwork uploaded" });
    },
    onError: () => toast({ title: "Failed to upload artwork", variant: "destructive" }),
  });

  const deleteArtworkMutation = useMutation({
    mutationFn: async ({ artworkId, orderItemId }: { artworkId: string; orderItemId: string }) => {
      const res = await fetch(`/api/order-items/${orderItemId}/artworks/${artworkId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete artwork");
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Artwork removed" });
    },
    onError: () => toast({ title: "Failed to remove artwork", variant: "destructive" }),
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
    queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/all-item-lines`] });
    queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/all-item-charges`] });
    queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/all-artworks`] });
  }

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

  const marginColor = (m: number) => m >= 30 ? "text-green-600" : m >= 15 ? "text-yellow-600" : "text-red-600";
  const marginBg = (m: number) => m >= 30 ? "bg-green-50" : m >= 15 ? "bg-yellow-50" : "bg-red-50";

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

  const saveEditItem = async () => {
    if (!editingItem) return;

    // 1. Update the item-level data (imprint, notes)
    const totalQty = editDialogLines.reduce((s, l) => s + (l.quantity || 0), 0);
    const totalRevenue = editDialogLines.reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0), 0);
    const totalCost = editDialogLines.reduce((s, l) => s + (l.quantity || 0) * (l.cost || 0), 0);
    const avgPrice = totalQty > 0 ? totalRevenue / totalQty : 0;
    const avgCost = totalQty > 0 ? totalCost / totalQty : 0;

    await updateOrderItemMutation.mutateAsync({
      itemId: editingItem.id,
      updates: {
        imprintMethod: editItemData.imprintMethod,
        imprintLocation: editItemData.imprintLocation,
        notes: editItemData.notes,
        quantity: totalQty,
        cost: avgCost.toFixed(2),
        unitPrice: avgPrice.toFixed(2),
        totalPrice: totalRevenue.toFixed(2),
        color: editDialogLines.length === 1 ? editDialogLines[0].color : "",
        size: editDialogLines.length === 1 ? editDialogLines[0].size : "",
      },
    });

    // 2. Sync line items: delete removed, update existing, create new
    const existingLines: OrderItemLine[] = allItemLines[editingItem.id] || [];
    const existingIds = new Set(existingLines.map(l => l.id));
    const editIds = new Set(editDialogLines.filter(l => l.isExisting).map(l => l.id));

    // Delete lines that were removed
    for (const existing of existingLines) {
      if (!editIds.has(existing.id)) {
        await deleteLineMutation.mutateAsync({ lineId: existing.id, orderItemId: editingItem.id });
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
        await updateLineMutation.mutateAsync({
          lineId: line.id,
          orderItemId: editingItem.id,
          updates: lineData,
        });
      } else if (!line.isExisting) {
        await addLineMutation.mutateAsync({
          orderItemId: editingItem.id,
          line: lineData,
        });
      }
    }

    invalidateAll();
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
    });
  };

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
            {orderItems.length} {orderItems.length === 1 ? "item" : "items"}
          </Badge>
        </div>
        <Button size="sm" onClick={() => setLocation(addProductPath)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Empty State */}
      {orderItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No products in this order yet</p>
            <p className="text-sm mb-4">Click "Add Product" to add items from your catalog</p>
            <Button variant="outline" onClick={() => setLocation(addProductPath)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orderItems.map((item: any) => {
            const isExpanded = expandedItems.has(item.id);
            const itemSupplier = getItemSupplier(item);
            const imageUrl = getProductImage(item);
            const artworkCount = getArtworkCount(item.id);
            const artworks = allArtworkItems[item.id] || [];
            const lines: OrderItemLine[] = allItemLines[item.id] || [];
            const charges: OrderAdditionalCharge[] = allItemCharges[item.id] || [];
            const totals = getItemTotals(item);

            return (
              <Card key={item.id} className="overflow-hidden">
                {/* ── Collapsed Summary Row ── */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex gap-4">
                    {/* Expand Icon */}
                    <div className="flex-shrink-0 pt-1">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>

                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.productName} className="w-16 h-16 object-cover rounded border" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
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

                        {/* Summary numbers */}
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
                            <p className={`font-semibold ${marginColor(totals.margin)}`}>
                              {totals.margin.toFixed(1)}%
                            </p>
                          </div>

                          {/* Edit button (stop propagation) */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditItem(item);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                          </Button>
                          {/* Delete button (stop propagation) */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingProduct(item);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {/* Quick info row */}
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

                {/* ── Expanded Details ── */}
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

                    {/* ── LINE ITEMS TABLE ── */}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            addLineMutation.mutate({
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
                                const isEditing = editingLine === line.id;
                                const qty = line.quantity || 0;
                                const cost = parseFloat(line.cost || "0");
                                const price = parseFloat(line.unitPrice || "0");
                                const lineTotal = qty * price;
                                const m = calcMargin(cost, price);

                                if (isEditing) {
                                  const eQty = editLineData.quantity || 0;
                                  const eCost = parseFloat(editLineData.cost as string || "0");
                                  const ePrice = parseFloat(editLineData.unitPrice as string || "0");
                                  const eMargin = calcMargin(eCost, ePrice);

                                  return (
                                    <tr key={line.id} className="border-b bg-blue-50/30">
                                      <td className="p-1.5">
                                        <Input className="h-7 text-xs" value={editLineData.color || ""} onChange={(e) => setEditLineData(d => ({ ...d, color: e.target.value }))} />
                                      </td>
                                      <td className="p-1.5">
                                        <Input className="h-7 text-xs" value={editLineData.size || ""} onChange={(e) => setEditLineData(d => ({ ...d, size: e.target.value }))} />
                                      </td>
                                      <td className="p-1.5">
                                        <Input className="h-7 text-xs text-right" type="number" min={0} value={editLineData.quantity ?? 0} onChange={(e) => setEditLineData(d => ({ ...d, quantity: parseInt(e.target.value) || 0 }))} />
                                      </td>
                                      <td className="p-1.5">
                                        <Input className="h-7 text-xs text-right" type="number" step="0.01" value={editLineData.cost || ""} onChange={(e) => setEditLineData(d => ({ ...d, cost: e.target.value }))} />
                                      </td>
                                      <td className="p-1.5">
                                        <Input className="h-7 text-xs text-right" type="number" step="0.01" value={editLineData.unitPrice || ""} onChange={(e) => setEditLineData(d => ({ ...d, unitPrice: e.target.value }))} />
                                      </td>
                                      <td className="p-1.5 text-right">
                                        <span className={`text-xs font-medium ${marginColor(eMargin)}`}>{eMargin.toFixed(1)}%</span>
                                      </td>
                                      <td className="p-1.5 text-right text-xs font-medium">${(eQty * ePrice).toFixed(2)}</td>
                                      <td className="p-1.5">
                                        <div className="flex gap-0.5">
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => saveEditLine(line)} disabled={updateLineMutation.isPending}>
                                            {updateLineMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 text-green-600" />}
                                          </Button>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingLine(null)}>
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
                                      <span className={`text-xs font-medium ${marginColor(m)}`}>{m.toFixed(1)}%</span>
                                    </td>
                                    <td className="p-2.5 text-right text-xs font-medium">${lineTotal.toFixed(2)}</td>
                                    <td className="p-1.5">
                                      <div className="flex gap-0.5">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEditLine(line)}>
                                          <Edit2 className="w-3 h-3 text-gray-400" />
                                        </Button>
                                        <Button
                                          variant="ghost" size="sm" className="h-6 w-6 p-0"
                                          onClick={() => deleteLineMutation.mutate({ lineId: line.id, orderItemId: line.orderItemId })}
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
                                  <span className={`font-semibold ${marginColor(totals.margin)}`}>{totals.margin.toFixed(1)}%</span>
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

                    {/* ── ADDITIONAL CHARGES ── */}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddChargeForItem(item.id);
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
                                  onClick={() => deleteChargeMutation.mutate({ chargeId: charge.id, orderItemId: charge.orderItemId })}
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

                    {/* ── ARTWORK ── */}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadingArtworkForItem(item.id);
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
                                <img src={art.filePath} alt={art.name} className="w-full h-20 object-contain rounded mb-1.5" />
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
                                    className={`text-[9px] ${
                                      art.status === "approved" ? "border-green-300 text-green-700" :
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteArtworkMutation.mutate({ artworkId: art.id, orderItemId: item.id });
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

          {/* ── ORDER TOTALS ── */}
          <Card className={`${marginBg(orderMargin)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Items</span>
                    <p className="font-semibold">{orderItems.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Total Qty</span>
                    <p className="font-semibold">{orderTotals.totalQty}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Total Cost</span>
                    <p className="font-semibold text-gray-600">${orderTotals.totalCost.toFixed(2)}</p>
                  </div>
                  {orderTotals.totalCharges > 0 && (
                    <div>
                      <span className="text-gray-500 text-xs">Charges</span>
                      <p className="font-semibold">${orderTotals.totalCharges.toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 text-xs">Margin</span>
                    <p className={`font-bold flex items-center gap-1 ${marginColor(orderMargin)}`}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      {orderMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Subtotal</span>
                  <p className="text-xl font-bold text-blue-600">${(orderTotals.subtotal + orderTotals.totalCharges).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ ADD CHARGE DIALOG ═══ */}
      <Dialog open={!!addChargeForItem} onOpenChange={(open) => !open && setAddChargeForItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Additional Charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description *</Label>
              <Input
                value={newCharge.description}
                onChange={(e) => setNewCharge(c => ({ ...c, description: e.target.value }))}
                placeholder="e.g., Setup Fee, Rush Charge"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={newCharge.chargeType} onValueChange={(v) => setNewCharge(c => ({ ...c, chargeType: v }))}>
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
                  value={newCharge.amount}
                  onChange={(e) => setNewCharge(c => ({ ...c, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="vendor-charge"
                checked={newCharge.isVendorCharge}
                onChange={(e) => setNewCharge(c => ({ ...c, isVendorCharge: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="vendor-charge" className="font-normal text-sm">This is a vendor charge (cost, not revenue)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddChargeForItem(null)}>Cancel</Button>
            <Button
              disabled={!newCharge.description || newCharge.amount <= 0 || addChargeMutation.isPending}
              onClick={() => {
                if (!addChargeForItem) return;
                addChargeMutation.mutate({
                  orderItemId: addChargeForItem,
                  charge: {
                    description: newCharge.description,
                    chargeType: newCharge.chargeType,
                    amount: newCharge.amount.toFixed(2),
                    isVendorCharge: newCharge.isVendorCharge,
                  },
                });
              }}
            >
              {addChargeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE ITEM DIALOG ═══ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Remove Item from Order?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deletingProduct?.productName}</strong> from this order?
              {deletingProduct?.productSku && (
                <span className="block mt-1 text-xs text-gray-500">SKU: {deletingProduct.productSku}</span>
              )}
              <span className="block mt-2 text-orange-600 font-medium">
                This will remove the item and all its line items, charges, and artwork from this order.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeletingProduct(null); setIsDeleteDialogOpen(false); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduct && deleteOrderItemMutation.mutate(deletingProduct.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteOrderItemMutation.isPending}
            >
              {deleteOrderItemMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removing...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Remove Item</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ EDIT ITEM DIALOG (commonsku-style with line items) ═══ */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              Edit Product
            </DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-5">
              {/* Product Info Header */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                {(() => {
                  const img = getProductImage(editingItem);
                  return img ? (
                    <img src={img} alt={editingItem.productName} className="w-16 h-16 object-contain rounded border bg-white" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  );
                })()}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{editingItem.productName || "Unnamed Product"}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {editingItem.productSku && (
                      <Badge variant="outline" className="text-xs">{editingItem.productSku}</Badge>
                    )}
                    {getItemSupplier(editingItem) && (
                      <span className="text-sm text-gray-500">{getItemSupplier(editingItem)?.name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Imprint Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Imprint Method</Label>
                  <Input
                    value={editItemData.imprintMethod}
                    onChange={(e) => setEditItemData((d: any) => ({ ...d, imprintMethod: e.target.value }))}
                    placeholder="e.g., Screen Print, Embroidery"
                  />
                </div>
                <div>
                  <Label>Imprint Location</Label>
                  <Input
                    value={editItemData.imprintLocation}
                    onChange={(e) => setEditItemData((d: any) => ({ ...d, imprintLocation: e.target.value }))}
                    placeholder="e.g., Front Center, Left Chest"
                  />
                </div>
              </div>

              {/* Size/Color Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Size & Color Breakdown</Label>
                  <Button variant="outline" size="sm" onClick={addEditDialogLine}>
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
                      {editDialogLines.map((line) => {
                        const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
                        const lineMargin = line.unitPrice > 0
                          ? ((line.unitPrice - line.cost) / line.unitPrice * 100) : 0;
                        return (
                          <tr key={line.id} className="border-b last:border-0">
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs"
                                value={line.color}
                                onChange={(e) => updateEditDialogLine(line.id, "color", e.target.value)}
                                placeholder="Color"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs"
                                value={line.size}
                                onChange={(e) => updateEditDialogLine(line.id, "size", e.target.value)}
                                placeholder="Size"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                min={0}
                                value={line.quantity}
                                onChange={(e) => updateEditDialogLine(line.id, "quantity", parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.cost}
                                onChange={(e) => updateEditDialogLine(line.id, "cost", parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.unitPrice}
                                onChange={(e) => updateEditDialogLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2 text-right">
                              <span className={`text-xs font-medium ${marginColor(lineMargin)}`}>
                                {lineMargin.toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              <span className="text-xs font-medium">${lineTotal.toFixed(2)}</span>
                            </td>
                            <td className="p-2">
                              {editDialogLines.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => removeEditDialogLine(line.id)}
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
                        <td className="p-3 text-right text-sm font-semibold">{editDialogTotals.qty}</td>
                        <td className="p-3 text-right text-sm text-gray-500">${editDialogTotals.cost.toFixed(2)}</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right">
                          <span className={`text-sm font-semibold ${marginColor(editDialogMargin)}`}>
                            {editDialogMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right text-sm font-semibold">${editDialogTotals.revenue.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Margin Summary */}
              <div className={`rounded-lg p-3 ${marginBg(editDialogMargin)} flex items-center justify-between text-sm`}>
                <div className="flex items-center gap-6">
                  <span className="text-gray-600">
                    Total Qty: <strong>{editDialogTotals.qty}</strong>
                  </span>
                  <span className="text-gray-600">
                    Total Cost: <strong>${editDialogTotals.cost.toFixed(2)}</strong>
                  </span>
                  <span className="text-gray-600">
                    Margin: <strong className={marginColor(editDialogMargin)}>{editDialogMargin.toFixed(1)}%</strong>
                  </span>
                  <span className="text-gray-600">
                    Profit: <strong className="text-green-700">${(editDialogTotals.revenue - editDialogTotals.cost).toFixed(2)}</strong>
                  </span>
                </div>
                <span className="font-bold text-blue-600 text-base">${editDialogTotals.revenue.toFixed(2)}</span>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editItemData.notes}
                  onChange={(e: any) => setEditItemData((d: any) => ({ ...d, notes: e.target.value }))}
                  placeholder="Product-specific notes..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button
              onClick={saveEditItem}
              disabled={updateOrderItemMutation.isPending || updateLineMutation.isPending || addLineMutation.isPending}
            >
              {(updateOrderItemMutation.isPending || updateLineMutation.isPending || addLineMutation.isPending) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ ARTWORK UPLOAD DIALOG ═══ */}
      <Dialog open={!!uploadingArtworkForItem} onOpenChange={(open) => !open && setUploadingArtworkForItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Artwork
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const fileInput = form.elements.namedItem("artworkFile") as HTMLInputElement;
              const nameInput = form.elements.namedItem("artworkName") as HTMLInputElement;
              const locationInput = form.elements.namedItem("artworkLocation") as HTMLInputElement;
              const typeInput = form.elements.namedItem("artworkType") as HTMLInputElement;
              const file = fileInput?.files?.[0];
              if (!file || !uploadingArtworkForItem) return;
              uploadArtworkMutation.mutate({
                orderItemId: uploadingArtworkForItem,
                file,
                name: nameInput.value || file.name,
                location: locationInput.value || undefined,
                artworkType: typeInput.value || undefined,
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="artworkFile">File *</Label>
              <Input id="artworkFile" name="artworkFile" type="file" accept="image/*,.pdf,.ai,.eps,.svg" required />
            </div>
            <div>
              <Label htmlFor="artworkName">Name</Label>
              <Input id="artworkName" name="artworkName" placeholder="e.g., Logo Front" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="artworkLocation">Location</Label>
                <Input id="artworkLocation" name="artworkLocation" placeholder="e.g., Left Chest" />
              </div>
              <div>
                <Label htmlFor="artworkType">Type</Label>
                <Input id="artworkType" name="artworkType" placeholder="e.g., Embroidery" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadingArtworkForItem(null)}>Cancel</Button>
              <Button type="submit" disabled={uploadArtworkMutation.isPending}>
                {uploadArtworkMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
