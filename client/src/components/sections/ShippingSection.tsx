import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function ShippingSection({ orderId, data, isLocked }: ShippingSectionProps) {
  const { order, shipments, shipmentsLoading } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<OrderShipment | null>(null);
  const [form, setForm] = useState<ShipmentFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<OrderShipment | null>(null);

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

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/shipments`] });
    queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
  }, [queryClient, orderId]);

  const setField = useCallback((key: keyof ShipmentFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  // Open form — new or edit
  const openNew = useCallback(() => {
    setEditingShipment(null);
    // Pre-fill from order's shipping address
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

  /* ── Mutations ── */

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await fetch(`/api/orders/${orderId}/shipments`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
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
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update shipment");
      return res.json();
    },
    onSuccess: () => { invalidate(); setIsFormOpen(false); toast({ title: "Shipment updated" }); },
    onError: () => toast({ title: "Failed to update shipment", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${orderId}/shipments/${id}`, { method: "DELETE" });
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

  // ── Summary ──
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
          <Badge variant="secondary" className="text-xs">
            {shipments.length} shipment{shipments.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button size="sm" onClick={openNew} disabled={isLocked}>
          <Plus className="w-4 h-4 mr-2" /> Add Shipment
        </Button>
      </div>

      {/* Timeline Warnings */}
      <TimelineWarningBanner conflicts={hasTimelineConflict(order, shipments)} />

      {/* Key Dates Context */}
      {(order?.inHandsDate || (order as any)?.supplierInHandsDate || (order as any)?.eventDate) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 flex items-center gap-6 text-sm flex-wrap">
            {order?.inHandsDate && (
              <div>
                <span className="text-blue-600 text-xs font-medium">Customer In-Hands</span>
                <p className="font-semibold">{fmtDate(order.inHandsDate)}</p>
              </div>
            )}
            {(order as any)?.supplierInHandsDate && (
              <div>
                <span className="text-blue-600 text-xs font-medium">Supplier In-Hands</span>
                <p className="font-semibold">{fmtDate((order as any).supplierInHandsDate)}</p>
              </div>
            )}
            {(order as any)?.eventDate && (
              <div>
                <span className="text-blue-600 text-xs font-medium">Event Date</span>
                <p className="font-semibold">{fmtDate((order as any).eventDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ship-to Address Card */}
      {parsedAddress && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" /> Ship-To Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-0.5">
            {parsedAddress.contactName && <p className="font-medium">{parsedAddress.contactName}</p>}
            {parsedAddress.company && <p className="text-gray-600">{parsedAddress.company}</p>}
            {parsedAddress.street && <p>{parsedAddress.street}</p>}
            {(parsedAddress.city || parsedAddress.state || parsedAddress.zipCode) && (
              <p>{[parsedAddress.city, parsedAddress.state, parsedAddress.zipCode].filter(Boolean).join(", ")}</p>
            )}
            {parsedAddress.phone && <p className="text-gray-500">{parsedAddress.phone}</p>}
          </CardContent>
        </Card>
      )}

      {/* Loading / Empty / List */}
      {shipmentsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : shipments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No shipments yet</p>
            <p className="text-xs text-gray-400 mb-4">Click "Add Shipment" to create your first shipment</p>
            <Button variant="outline" size="sm" onClick={openNew} disabled={isLocked}>
              <Plus className="w-4 h-4 mr-1" /> Add Shipment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Shipment Cards */}
          <div className="space-y-3">
            {shipments.map((s) => {
              const trackUrl = getTrackingUrl(s.carrier, s.trackingNumber);
              return (
                <Card key={s.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(s.status)}
                          {s.carrier && <span className="text-sm font-medium">{s.carrier}</span>}
                          {s.shippingMethod && <span className="text-xs text-gray-500">{s.shippingMethod}</span>}
                        </div>

                        {/* Tracking */}
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

                        {/* Dates */}
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

                        {/* Ship-to */}
                        {(s.shipToName || s.shipToCompany || s.shipToAddress) && (
                          <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>
                              {[s.shipToName, s.shipToCompany, s.shipToAddress].filter(Boolean).join(" - ")}
                            </span>
                          </div>
                        )}

                        {s.notes && <p className="mt-2 text-xs text-gray-500 italic">{s.notes}</p>}
                      </div>

                      {/* Right */}
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
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-5">
                  <div>
                    <span className="text-gray-500 text-xs">Shipments</span>
                    <p className="font-semibold">{shipments.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Delivered</span>
                    <p className="font-semibold text-green-600">{deliveredCount} / {shipments.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Total Shipping</span>
                  <p className="text-lg font-bold text-blue-600">${totalShippingCost.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══ SHIPMENT FORM DIALOG ═══ */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingShipment ? "Edit Shipment" : "Add Shipment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Carrier & Method */}
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

            {/* Tracking & Cost */}
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

            {/* Dates */}
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

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Ship-To */}
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

            {/* Notes */}
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
