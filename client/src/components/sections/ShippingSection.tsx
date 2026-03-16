import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Truck, Plus, MapPin, Edit2, Trash2, ExternalLink,
  Calendar, Clock, Loader2, AlertTriangle, CheckCircle2,
  Package, Filter, Pencil, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hasTimelineConflict, getDateStatus } from "@/lib/dateUtils";
import TimelineWarningBanner from "@/components/TimelineWarningBanner";
import type { ProjectData } from "@/types/project-types";
import type { OrderShipment } from "@shared/schema";

/* ── Constants ── */
const CARRIERS = ["UPS", "FedEx", "USPS", "DHL", "Freight", "Local Delivery", "Other"] as const;
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-gray-100 text-gray-700" },
  { value: "shipped", label: "Shipped", color: "bg-blue-100 text-blue-700" },
  { value: "in_transit", label: "In Transit", color: "bg-indigo-100 text-indigo-700" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-700" },
  { value: "returned", label: "Returned", color: "bg-red-100 text-red-700" },
] as const;

const SHIP_TO_OPTIONS = [
  { value: "client", label: "Client" },
  { value: "decorator", label: "Decorator" },
  { value: "other_supplier", label: "Other Supplier" },
  { value: "fulfillment", label: "Fulfillment Warehouse" },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "ours", label: "Our Account" },
  { value: "client", label: "Client's Account" },
  { value: "supplier", label: "Supplier's Account" },
  { value: "other", label: "Other" },
];

const EMPTY_FORM: ShipmentFormData = {
  carrier: "", shippingMethod: "", trackingNumber: "", shippingCost: "",
  shipDate: "", estimatedDelivery: "", shipToName: "", shipToCompany: "",
  shipToAddress: "", shipToPhone: "", status: "pending", notes: "",
};

interface ShipmentFormData {
  carrier: string; shippingMethod: string; trackingNumber: string; shippingCost: string;
  shipDate: string; estimatedDelivery: string; shipToName: string; shipToCompany: string;
  shipToAddress: string; shipToPhone: string; status: string; notes: string;
}

interface ShippingSectionProps {
  orderId: string;
  data: ProjectData;
  isLocked?: boolean;
}

/* ── Bulk Edit Form ── */
interface BulkEditData {
  shippingDestination: string;
  shippingAccountType: string;
  shippingMethodOverride: string;
  shippingNotes: string;
}

const EMPTY_BULK: BulkEditData = {
  shippingDestination: "",
  shippingAccountType: "",
  shippingMethodOverride: "",
  shippingNotes: "",
};

export default function ShippingSection({ orderId, data, isLocked }: ShippingSectionProps) {
  const { order, orderItems, orderVendors, shipments, shipmentsLoading } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Shipment tracking state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<OrderShipment | null>(null);
  const [form, setForm] = useState<ShipmentFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<OrderShipment | null>(null);

  // Shipping details table state
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkEditData>(EMPTY_BULK);
  const [showShipmentTracking, setShowShipmentTracking] = useState(true);

  // Optimistic local state for shipping fields — keyed by `${itemId}:${field}`
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({});

  const getItemField = (item: any, field: string): string => {
    const key = `${item.id}:${field}`;
    if (key in localOverrides) return localOverrides[key];
    return item[field] || "";
  };

  const setLocalField = (itemId: string, field: string, value: string) => {
    setLocalOverrides(prev => ({ ...prev, [`${itemId}:${field}`]: value }));
  };


  // Parse order shipping address for auto-fill
  const parsedAddress = useMemo(() => {
    try {
      if ((order as any)?.shippingAddress) {
        return JSON.parse((order as any).shippingAddress as string);
      }
    } catch {
      return { street: (order as any)?.shippingAddress || "" };
    }
    return null;
  }, [order]);

  // Build supplier list from vendors
  const suppliers = useMemo(() => {
    return orderVendors.map((v: any) => ({ id: v.id, name: v.companyName || v.name || "Unknown Supplier" }));
  }, [orderVendors]);

  // Filter items by supplier
  const filteredItems = useMemo(() => {
    if (supplierFilter === "all") return orderItems;
    return orderItems.filter((item: any) => item.supplierId === supplierFilter);
  }, [orderItems, supplierFilter]);

  // Calculate shipping config progress (includes optimistic state)
  const shippingProgress = useMemo(() => {
    const total = orderItems.length;
    const configured = orderItems.filter((item: any) => {
      const dest = getItemField(item, "shippingDestination");
      return !!dest;
    }).length;
    return { total, configured };
  }, [orderItems, localOverrides]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/shipments`] });
    queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
  }, [queryClient, orderId]);

  const setField = useCallback((key: keyof ShipmentFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  // ── Shipping Details Mutations ──

  const updateItemShippingMutation = useMutation({
    mutationFn: async ({ itemId, fields }: { itemId: string; fields: Record<string, any> }) => {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Failed to update shipping details");
      return res.json();
    },
    onSuccess: () => {
      // Don't clear overrides here — refetch is async.
      // Overrides stay until server data catches up (harmless: same value).
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
    },
    onError: (_err, variables) => {
      // Revert local overrides on error so UI shows original server value
      setLocalOverrides(prev => {
        const next = { ...prev };
        for (const field of Object.keys(variables.fields)) {
          delete next[`${variables.itemId}:${field}`];
        }
        return next;
      });
      toast({ title: "Failed to update shipping details", variant: "destructive" });
    },
  });

  const handleItemShippingChange = (itemId: string, field: string, value: string) => {
    // Set optimistic local state immediately
    setLocalField(itemId, field, value);
    // Fire mutation
    updateItemShippingMutation.mutate({ itemId, fields: { [field]: value || null } });
  };

  const handleBulkEdit = () => {
    if (selectedItems.size === 0) return;
    const fields: Record<string, any> = {};
    if (bulkForm.shippingDestination) fields.shippingDestination = bulkForm.shippingDestination;
    if (bulkForm.shippingAccountType) fields.shippingAccountType = bulkForm.shippingAccountType;
    if (bulkForm.shippingMethodOverride) fields.shippingMethodOverride = bulkForm.shippingMethodOverride;
    if (bulkForm.shippingNotes) fields.shippingNotes = bulkForm.shippingNotes;

    if (Object.keys(fields).length === 0) {
      toast({ title: "No fields to update", description: "Fill at least one field.", variant: "destructive" });
      return;
    }

    // Set optimistic local overrides for all selected items
    const itemIds = Array.from(selectedItems);
    setLocalOverrides(prev => {
      const next = { ...prev };
      itemIds.forEach(itemId => {
        Object.entries(fields).forEach(([field, value]) => {
          next[`${itemId}:${field}`] = value as string;
        });
      });
      return next;
    });

    const promises = Array.from(selectedItems).map(itemId =>
      updateItemShippingMutation.mutateAsync({ itemId, fields })
    );

    Promise.all(promises).then(() => {
      toast({ title: `Updated ${selectedItems.size} items` });
      setSelectedItems(new Set());
      setBulkEditOpen(false);
      setBulkForm(EMPTY_BULK);
    }).catch(() => {
      toast({ title: "Some items failed to update", variant: "destructive" });
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((i: any) => i.id)));
    }
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  // Get supplier name for an item
  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return "No Supplier";
    const s = suppliers.find((v: any) => v.id === supplierId);
    return s?.name || "Unknown";
  };

  // ── Shipment Tracking Mutations ──

  const openNew = useCallback(() => {
    setEditingShipment(null);
    setForm({
      ...EMPTY_FORM,
      shipToName: parsedAddress?.contactName || "",
      shipToCompany: parsedAddress?.company || "",
      shipToAddress: parsedAddress
        ? [parsedAddress.street, parsedAddress.city, parsedAddress.state, parsedAddress.zipCode].filter(Boolean).join(", ")
        : "",
      shipToPhone: parsedAddress?.phone || "",
    });
    setIsFormOpen(true);
  }, [parsedAddress]);

  const openEdit = useCallback((s: OrderShipment) => {
    setEditingShipment(s);
    setForm({
      carrier: s.carrier || "",
      shippingMethod: s.shippingMethod || "",
      trackingNumber: s.trackingNumber || "",
      shippingCost: s.shippingCost || "",
      shipDate: s.shipDate ? new Date(s.shipDate).toISOString().slice(0, 10) : "",
      estimatedDelivery: s.estimatedDelivery ? new Date(s.estimatedDelivery).toISOString().slice(0, 10) : "",
      shipToName: s.shipToName || "",
      shipToCompany: s.shipToCompany || "",
      shipToAddress: s.shipToAddress || "",
      shipToPhone: s.shipToPhone || "",
      status: s.status || "pending",
      notes: s.notes || "",
    });
    setIsFormOpen(true);
  }, []);

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await fetch(`/api/orders/${orderId}/shipments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create shipment");
      return res.json();
    },
    onSuccess: () => { invalidate(); setIsFormOpen(false); toast({ title: "Shipment created" }); },
    onError: () => toast({ title: "Failed to create shipment", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, any> }) => {
      const res = await fetch(`/api/orders/${orderId}/shipments/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update shipment");
      return res.json();
    },
    onSuccess: () => { invalidate(); setIsFormOpen(false); toast({ title: "Shipment updated" }); },
    onError: () => toast({ title: "Failed to update shipment", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${orderId}/shipments/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete shipment");
    },
    onSuccess: () => { invalidate(); setDeleteTarget(null); toast({ title: "Shipment removed" }); },
    onError: () => toast({ title: "Failed to delete shipment", variant: "destructive" }),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    const payload: Record<string, any> = {
      carrier: form.carrier || null,
      shippingMethod: form.shippingMethod || null,
      trackingNumber: form.trackingNumber || null,
      shippingCost: form.shippingCost || null,
      shipDate: form.shipDate ? new Date(form.shipDate).toISOString() : null,
      estimatedDelivery: form.estimatedDelivery ? new Date(form.estimatedDelivery).toISOString() : null,
      shipToName: form.shipToName || null,
      shipToCompany: form.shipToCompany || null,
      shipToAddress: form.shipToAddress || null,
      shipToPhone: form.shipToPhone || null,
      status: form.status,
      notes: form.notes || null,
    };

    if (editingShipment) {
      updateMutation.mutate({ id: editingShipment.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
    return <Badge className={`${opt.color} text-xs`}>{opt.label}</Badge>;
  };

  const getTrackingUrl = (carrier: string | null, tracking: string | null) => {
    if (!tracking) return null;
    const c = (carrier || "").toLowerCase();
    if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${tracking}`;
    if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
    if (c.includes("dhl")) return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${tracking}`;
    return null;
  };

  const fmtDate = (d: string | Date | null) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "--";

  const totalShippingCost = shipments.reduce((s, sh) => s + parseFloat(sh.shippingCost || "0"), 0);
  const deliveredCount = shipments.filter(s => s.status === "delivered").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5" /> Shipping
          </h2>
        </div>
      </div>

      {/* Timeline Warnings */}
      <TimelineWarningBanner conflicts={hasTimelineConflict(order, shipments)} />

      {/* Key Dates Context */}
      {(order?.inHandsDate || (order as any)?.supplierInHandsDate || (order as any)?.eventDate) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <dl className="flex items-center gap-6 text-sm flex-wrap">
              {order?.inHandsDate && (
                <div>
                  <dt className="text-blue-600 text-xs font-medium">Customer In-Hands</dt>
                  <dd className="font-semibold">
                    <time dateTime={new Date(order.inHandsDate).toISOString().slice(0, 10)}>{fmtDate(order.inHandsDate)}</time>
                  </dd>
                </div>
              )}
              {(order as any)?.supplierInHandsDate && (
                <div>
                  <dt className="text-blue-600 text-xs font-medium">Supplier In-Hands</dt>
                  <dd className="font-semibold">
                    <time dateTime={new Date((order as any).supplierInHandsDate).toISOString().slice(0, 10)}>{fmtDate((order as any).supplierInHandsDate)}</time>
                  </dd>
                </div>
              )}
              {(order as any)?.eventDate && (
                <div>
                  <dt className="text-blue-600 text-xs font-medium">Event Date</dt>
                  <dd className="font-semibold">
                    <time dateTime={new Date((order as any).eventDate).toISOString().slice(0, 10)}>{fmtDate((order as any).eventDate)}</time>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 1: SHIPPING DETAILS (CommonSKU-style)          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" /> Shipping Details
              </CardTitle>
              <Badge variant={shippingProgress.configured === shippingProgress.total && shippingProgress.total > 0 ? "default" : "secondary"} className="text-xs">
                {shippingProgress.configured}/{shippingProgress.total} configured
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* Supplier Filter */}
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <Filter className="w-3 h-3 mr-1.5" />
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Bulk Edit */}
              {selectedItems.size > 0 && !isLocked && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    setBulkForm(EMPTY_BULK);
                    setBulkEditOpen(true);
                  }}
                >
                  <Pencil className="w-3 h-3" />
                  Edit Selected ({selectedItems.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orderItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No products in this order yet.</p>
          ) : (
            <table className="w-full border rounded-lg overflow-hidden text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-medium text-gray-500">
                  <th className="w-8 px-3 py-2 text-left">
                    <Checkbox
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onCheckedChange={toggleSelectAll}
                      disabled={isLocked}
                    />
                  </th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="w-[140px] px-3 py-2 text-left">Ship To</th>
                  <th className="w-[140px] px-3 py-2 text-left">Account Type</th>
                  <th className="w-[140px] px-3 py-2 text-left">Method</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item: any) => {
                  const isSelected = selectedItems.has(item.id);
                  const dest = getItemField(item, "shippingDestination");
                  const isConfigured = !!dest;
                  return (
                    <tr
                      key={item.id}
                      className={`border-b last:border-b-0 ${!isConfigured ? "bg-amber-50/50" : ""}`}
                    >
                      <td className="px-3 py-2.5 align-middle">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleItem(item.id)}
                          disabled={isLocked}
                        />
                      </td>

                      <td className="px-3 py-2.5 align-middle">
                        <p className="font-medium text-sm truncate">{item.productName || "Unnamed Product"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getSupplierName(item.supplierId)}
                          {item.productSku && <span className="ml-2 text-gray-400">SKU: {item.productSku}</span>}
                        </p>
                      </td>

                      <td className="px-3 py-2.5 align-middle">
                        <select
                          className="w-full h-7 text-xs border rounded px-1.5 bg-white disabled:opacity-50 cursor-pointer"
                          value={dest}
                          disabled={isLocked}
                          onChange={(e) => handleItemShippingChange(item.id, "shippingDestination", e.target.value)}
                        >
                          <option value="">Select...</option>
                          {SHIP_TO_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-2.5 align-middle">
                        <select
                          className="w-full h-7 text-xs border rounded px-1.5 bg-white disabled:opacity-50 cursor-pointer"
                          value={getItemField(item, "shippingAccountType")}
                          disabled={isLocked}
                          onChange={(e) => handleItemShippingChange(item.id, "shippingAccountType", e.target.value)}
                        >
                          <option value="">Select...</option>
                          {ACCOUNT_TYPE_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-2.5 align-middle">
                        <input
                          className="w-full h-7 text-xs border rounded px-1.5 bg-white disabled:opacity-50"
                          placeholder="e.g., Ground"
                          defaultValue={item.shippingMethodOverride || ""}
                          key={`method-${item.id}-${item.shippingMethodOverride || ""}`}
                          disabled={isLocked}
                          onBlur={(e) => {
                            if (e.target.value !== (item.shippingMethodOverride || "")) {
                              handleItemShippingChange(item.id, "shippingMethodOverride", e.target.value);
                            }
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        />
                      </td>

                      <td className="px-3 py-2.5 align-middle">
                        <input
                          className="w-full h-7 text-xs border rounded px-1.5 bg-white disabled:opacity-50"
                          placeholder="Shipping notes..."
                          defaultValue={item.shippingNotes || ""}
                          key={`notes-${item.id}-${item.shippingNotes || ""}`}
                          disabled={isLocked}
                          onBlur={(e) => {
                            if (e.target.value !== (item.shippingNotes || "")) {
                              handleItemShippingChange(item.id, "shippingNotes", e.target.value);
                            }
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Incomplete warning */}
          {shippingProgress.total > 0 && shippingProgress.configured < shippingProgress.total && (
            <div className="flex items-center gap-2 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                {shippingProgress.total - shippingProgress.configured} product{shippingProgress.total - shippingProgress.configured !== 1 ? "s" : ""} still need shipping details configured.
                POs cannot be generated until all products have shipping details.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ship-to Address Card */}
      {parsedAddress && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" /> Ship-To Address (Order Default)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <address className="not-italic space-y-0.5">
              {parsedAddress.contactName && <p className="font-medium">{parsedAddress.contactName}</p>}
              {parsedAddress.company && <p className="text-gray-600">{parsedAddress.company}</p>}
              {parsedAddress.street && <p>{parsedAddress.street}</p>}
              {(parsedAddress.city || parsedAddress.state || parsedAddress.zipCode) && (
                <p>{[parsedAddress.city, parsedAddress.state, parsedAddress.zipCode].filter(Boolean).join(", ")}</p>
              )}
              {parsedAddress.phone && <p className="text-gray-500">{parsedAddress.phone}</p>}
            </address>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 2: SHIPMENT TRACKING                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div>
        <button
          className="flex items-center gap-2 w-full text-left py-2 hover:bg-gray-50 rounded-md px-1 transition-colors"
          onClick={() => setShowShipmentTracking(!showShipmentTracking)}
        >
          {showShipmentTracking ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Truck className="w-4 h-4" /> Shipment Tracking
          </h3>
          <Badge variant="secondary" className="text-xs">
            {shipments.length} shipment{shipments.length !== 1 ? "s" : ""}
          </Badge>
        </button>

        {showShipmentTracking && (
          <div className="space-y-3 mt-2">
            <div className="flex justify-end">
              <Button size="sm" onClick={openNew} disabled={isLocked}>
                <Plus className="w-4 h-4 mr-2" /> Add Shipment
              </Button>
            </div>

            {shipmentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : shipments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm mb-1">No shipments yet</p>
                  <p className="text-xs text-gray-400">Shipments will appear here once orders are shipped</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {shipments.map((s) => {
                    const trackUrl = getTrackingUrl(s.carrier, s.trackingNumber);
                    return (
                      <Card key={s.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(s.status)}
                                {s.carrier && <span className="text-sm font-medium">{s.carrier}</span>}
                                {s.shippingMethod && <span className="text-xs text-gray-500">{s.shippingMethod}</span>}
                              </div>

                              {s.trackingNumber && (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs text-gray-500">Tracking:</span>
                                  <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{s.trackingNumber}</code>
                                  {trackUrl && (
                                    <a href={trackUrl} target="_blank" rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 text-xs">
                                      Track <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {s.shipDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Ship: {fmtDate(s.shipDate)}
                                  </span>
                                )}
                                {s.estimatedDelivery && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> ETA: {fmtDate(s.estimatedDelivery)}
                                  </span>
                                )}
                                {s.actualDelivery && (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-3 h-3" /> Delivered: {fmtDate(s.actualDelivery)}
                                  </span>
                                )}
                              </div>

                              {(s.shipToName || s.shipToCompany || s.shipToAddress) && (
                                <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <span>{[s.shipToName, s.shipToCompany, s.shipToAddress].filter(Boolean).join(" - ")}</span>
                                </div>
                              )}

                              {s.notes && <p className="mt-2 text-xs text-gray-500 italic">{s.notes}</p>}
                            </div>

                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              {s.shippingCost && parseFloat(s.shippingCost) > 0 && (
                                <span className="text-sm font-semibold">${parseFloat(s.shippingCost).toFixed(2)}</span>
                              )}
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isLocked} onClick={() => openEdit(s)}>
                                  <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isLocked} onClick={() => setDeleteTarget(s)}>
                                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Summary */}
                <Card className="bg-blue-50/60">
                  <CardContent className="p-4">
                    <dl className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-5">
                        <div>
                          <dt className="text-gray-500 text-xs">Shipments</dt>
                          <dd className="font-semibold">{shipments.length}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 text-xs">Delivered</dt>
                          <dd className="font-semibold text-green-600">{deliveredCount} / {shipments.length}</dd>
                        </div>
                      </div>
                      <div className="text-right">
                        <dt className="text-xs text-gray-500">Total Shipping</dt>
                        <dd className="text-lg font-bold text-blue-600">${totalShippingCost.toFixed(2)}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══ BULK EDIT DIALOG ═══ */}
      <Dialog open={bulkEditOpen} onOpenChange={(open) => !open && setBulkEditOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit Shipping — {selectedItems.size} items</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Only filled fields will be updated. Empty fields will be left unchanged.</p>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Ship To</Label>
              <Select value={bulkForm.shippingDestination} onValueChange={(v) => setBulkForm(p => ({ ...p, shippingDestination: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="(no change)" /></SelectTrigger>
                <SelectContent>
                  {SHIP_TO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Account Type</Label>
              <Select value={bulkForm.shippingAccountType} onValueChange={(v) => setBulkForm(p => ({ ...p, shippingAccountType: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="(no change)" /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Shipping Method</Label>
              <Input
                className="h-8 text-sm"
                placeholder="(no change)"
                value={bulkForm.shippingMethodOverride}
                onChange={(e) => setBulkForm(p => ({ ...p, shippingMethodOverride: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Shipping Notes</Label>
              <Textarea
                className="text-sm"
                rows={2}
                placeholder="(no change)"
                value={bulkForm.shippingNotes}
                onChange={(e) => setBulkForm(p => ({ ...p, shippingNotes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBulkEdit} disabled={updateItemShippingMutation.isPending}>
              {updateItemShippingMutation.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              Update {selectedItems.size} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ SHIPMENT FORM DIALOG ═══ */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingShipment ? "Edit Shipment" : "Add Shipment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Carrier</Label>
                <Select value={form.carrier} onValueChange={(v) => setField("carrier", v)}>
                  <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>
                    {CARRIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Shipping Method</Label>
                <Input value={form.shippingMethod} onChange={(e) => setField("shippingMethod", e.target.value)} placeholder="e.g., Ground, 2-Day" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tracking Number</Label>
                <Input value={form.trackingNumber} onChange={(e) => setField("trackingNumber", e.target.value)} placeholder="Enter tracking #" />
              </div>
              <div>
                <Label>Shipping Cost</Label>
                <Input type="number" step="0.01" min={0} value={form.shippingCost} onChange={(e) => setField("shippingCost", e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ship Date</Label>
                <Input type="date" value={form.shipDate} onChange={(e) => setField("shipDate", e.target.value)} />
              </div>
              <div>
                <Label>Estimated Delivery</Label>
                <Input type="date" value={form.estimatedDelivery} onChange={(e) => setField("estimatedDelivery", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" /> Ship-To Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contact Name</Label>
                  <Input value={form.shipToName} onChange={(e) => setField("shipToName", e.target.value)} />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input value={form.shipToCompany} onChange={(e) => setField("shipToCompany", e.target.value)} />
                </div>
              </div>
              <div className="mt-3">
                <Label>Address</Label>
                <Textarea value={form.shipToAddress} onChange={(e) => setField("shipToAddress", e.target.value)} rows={2} />
              </div>
              <div className="mt-3">
                <Label>Phone</Label>
                <Input value={form.shipToPhone} onChange={(e) => setField("shipToPhone", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} placeholder="Internal notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : editingShipment ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editingShipment ? "Update" : "Create"} Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE DIALOG ═══ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" /> Delete Shipment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.carrier && <span>Carrier: <strong>{deleteTarget.carrier}</strong><br /></span>}
              {deleteTarget?.trackingNumber && <span>Tracking: <strong>{deleteTarget.trackingNumber}</strong><br /></span>}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
