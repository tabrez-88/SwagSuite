import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import TimelineWarningBanner from "@/components/shared/TimelineWarningBanner";
import { useShippingSection } from "./hooks";
import {
  CARRIERS, STATUS_OPTIONS, SHIP_TO_OPTIONS, ACCOUNT_TYPE_OPTIONS,
} from "./types";
import type { ShippingSectionProps } from "./types";

function getStatusBadge(status: string | null) {
  const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
  return <Badge className={`${opt.color} text-xs`}>{opt.label}</Badge>;
}

const fmtDate = (d: string | Date | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "--";

export default function ShippingSection({ orderId, data, isLocked }: ShippingSectionProps) {
  const h = useShippingSection(orderId, data);

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
      <TimelineWarningBanner conflicts={h.timelineConflicts} />

      {/* Key Dates Context */}
      {(h.order?.inHandsDate || (h.order as any)?.supplierInHandsDate || (h.order as any)?.eventDate) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <dl className="flex items-center gap-6 text-sm flex-wrap">
              {h.order?.inHandsDate && (
                <div>
                  <dt className="text-blue-600 text-xs font-medium">Customer In-Hands</dt>
                  <dd className="font-semibold">
                    <time dateTime={new Date(h.order.inHandsDate).toISOString().slice(0, 10)}>{fmtDate(h.order.inHandsDate)}</time>
                  </dd>
                </div>
              )}
              {(h.order as any)?.supplierInHandsDate && (
                <div>
                  <dt className="text-blue-600 text-xs font-medium">Supplier In-Hands</dt>
                  <dd className="font-semibold">
                    <time dateTime={new Date((h.order as any).supplierInHandsDate).toISOString().slice(0, 10)}>{fmtDate((h.order as any).supplierInHandsDate)}</time>
                  </dd>
                </div>
              )}
              {(h.order as any)?.eventDate && (
                <div>
                  <dt className="text-blue-600 text-xs font-medium">Event Date</dt>
                  <dd className="font-semibold">
                    <time dateTime={new Date((h.order as any).eventDate).toISOString().slice(0, 10)}>{fmtDate((h.order as any).eventDate)}</time>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* SECTION 1: SHIPPING DETAILS */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" /> Shipping Details
              </CardTitle>
              <Badge variant={h.shippingProgress.configured === h.shippingProgress.total && h.shippingProgress.total > 0 ? "default" : "secondary"} className="text-xs">
                {h.shippingProgress.configured}/{h.shippingProgress.total} configured
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select value={h.supplierFilter} onValueChange={h.setSupplierFilter}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <Filter className="w-3 h-3 mr-1.5" />
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {h.suppliers.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {h.selectedItems.size > 0 && !isLocked && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    h.setBulkForm({
                      shippingDestination: "",
                      shippingAccountType: "",
                      shippingMethodOverride: "",
                      shippingNotes: "",
                    });
                    h.setBulkEditOpen(true);
                  }}
                >
                  <Pencil className="w-3 h-3" />
                  Edit Selected ({h.selectedItems.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {h.orderItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No products in this order yet.</p>
          ) : (
            <table className="w-full border rounded-lg overflow-hidden text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-medium text-gray-500">
                  <th className="w-8 px-3 py-2 text-left">
                    <Checkbox
                      checked={h.selectedItems.size === h.filteredItems.length && h.filteredItems.length > 0}
                      onCheckedChange={h.toggleSelectAll}
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
                {h.filteredItems.map((item: any) => {
                  const isSelected = h.selectedItems.has(item.id);
                  const dest = h.getItemField(item, "shippingDestination");
                  const isConfigured = !!dest;
                  return (
                    <tr key={item.id} className={`border-b last:border-b-0 ${!isConfigured ? "bg-amber-50/50" : ""}`}>
                      <td className="px-3 py-2.5 align-middle">
                        <Checkbox checked={isSelected} onCheckedChange={() => h.toggleItem(item.id)} disabled={isLocked} />
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <p className="font-medium text-sm truncate">{item.productName || "Unnamed Product"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {h.getSupplierName(item.supplierId)}
                          {item.productSku && <span className="ml-2 text-gray-400">SKU: {item.productSku}</span>}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <select
                          className="w-full h-7 text-xs border rounded px-1.5 bg-white disabled:opacity-50 cursor-pointer"
                          value={dest}
                          disabled={isLocked}
                          onChange={(e) => h.handleItemShippingChange(item.id, "shippingDestination", e.target.value)}
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
                          value={h.getItemField(item, "shippingAccountType")}
                          disabled={isLocked}
                          onChange={(e) => h.handleItemShippingChange(item.id, "shippingAccountType", e.target.value)}
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
                              h.handleItemShippingChange(item.id, "shippingMethodOverride", e.target.value);
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
                              h.handleItemShippingChange(item.id, "shippingNotes", e.target.value);
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
          {h.shippingProgress.total > 0 && h.shippingProgress.configured < h.shippingProgress.total && (
            <div className="flex items-center gap-2 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                {h.shippingProgress.total - h.shippingProgress.configured} product{h.shippingProgress.total - h.shippingProgress.configured !== 1 ? "s" : ""} still need shipping details configured.
                POs cannot be generated until all products have shipping details.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ship-to Address Card */}
      {h.parsedAddress && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" /> Ship-To Address (Order Default)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <address className="not-italic space-y-0.5">
              {h.parsedAddress.contactName && <p className="font-medium">{h.parsedAddress.contactName}</p>}
              {h.parsedAddress.company && <p className="text-gray-600">{h.parsedAddress.company}</p>}
              {h.parsedAddress.street && <p>{h.parsedAddress.street}</p>}
              {(h.parsedAddress.city || h.parsedAddress.state || h.parsedAddress.zipCode) && (
                <p>{[h.parsedAddress.city, h.parsedAddress.state, h.parsedAddress.zipCode].filter(Boolean).join(", ")}</p>
              )}
              {h.parsedAddress.phone && <p className="text-gray-500">{h.parsedAddress.phone}</p>}
            </address>
          </CardContent>
        </Card>
      )}

      {/* SECTION 2: SHIPMENT TRACKING */}
      <div>
        <button
          className="flex items-center gap-2 w-full text-left py-2 hover:bg-gray-50 rounded-md px-1 transition-colors"
          onClick={() => h.setShowShipmentTracking(!h.showShipmentTracking)}
        >
          {h.showShipmentTracking ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Truck className="w-4 h-4" /> Shipment Tracking
          </h3>
          <Badge variant="secondary" className="text-xs">
            {h.shipments.length} shipment{h.shipments.length !== 1 ? "s" : ""}
          </Badge>
        </button>

        {h.showShipmentTracking && (
          <div className="space-y-3 mt-2">
            <div className="flex justify-end">
              <Button size="sm" onClick={h.openNew} disabled={isLocked}>
                <Plus className="w-4 h-4 mr-2" /> Add Shipment
              </Button>
            </div>

            {h.shipmentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : h.shipments.length === 0 ? (
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
                  {h.shipments.map((s) => {
                    const trackUrl = h.getTrackingUrl(s.carrier, s.trackingNumber);
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
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isLocked} onClick={() => h.openEdit(s)}>
                                  <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isLocked} onClick={() => h.setDeleteTarget(s)}>
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
                          <dd className="font-semibold">{h.shipments.length}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 text-xs">Delivered</dt>
                          <dd className="font-semibold text-green-600">{h.deliveredCount} / {h.shipments.length}</dd>
                        </div>
                      </div>
                      <div className="text-right">
                        <dt className="text-xs text-gray-500">Total Shipping</dt>
                        <dd className="text-lg font-bold text-blue-600">${h.totalShippingCost.toFixed(2)}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>

      {/* BULK EDIT DIALOG */}
      <Dialog open={h.bulkEditOpen} onOpenChange={(open) => !open && h.setBulkEditOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit Shipping — {h.selectedItems.size} items</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Only filled fields will be updated. Empty fields will be left unchanged.</p>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Ship To</Label>
              <Select value={h.bulkForm.shippingDestination} onValueChange={(v) => h.setBulkForm(p => ({ ...p, shippingDestination: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="(no change)" /></SelectTrigger>
                <SelectContent>
                  {SHIP_TO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Account Type</Label>
              <Select value={h.bulkForm.shippingAccountType} onValueChange={(v) => h.setBulkForm(p => ({ ...p, shippingAccountType: v }))}>
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
                value={h.bulkForm.shippingMethodOverride}
                onChange={(e) => h.setBulkForm(p => ({ ...p, shippingMethodOverride: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Shipping Notes</Label>
              <Textarea
                className="text-sm"
                rows={2}
                placeholder="(no change)"
                value={h.bulkForm.shippingNotes}
                onChange={(e) => h.setBulkForm(p => ({ ...p, shippingNotes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => h.setBulkEditOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={h.handleBulkEdit} disabled={h.updateItemShippingMutation.isPending}>
              {h.updateItemShippingMutation.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              Update {h.selectedItems.size} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SHIPMENT FORM DIALOG */}
      <Dialog open={h.isFormOpen} onOpenChange={(open) => !open && h.setIsFormOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{h.editingShipment ? "Edit Shipment" : "Add Shipment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Carrier</Label>
                <Select value={h.form.carrier} onValueChange={(v) => h.setField("carrier", v)}>
                  <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>
                    {CARRIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Shipping Method</Label>
                <Input value={h.form.shippingMethod} onChange={(e) => h.setField("shippingMethod", e.target.value)} placeholder="e.g., Ground, 2-Day" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tracking Number</Label>
                <Input value={h.form.trackingNumber} onChange={(e) => h.setField("trackingNumber", e.target.value)} placeholder="Enter tracking #" />
              </div>
              <div>
                <Label>Shipping Cost</Label>
                <Input type="number" step="0.01" min={0} value={h.form.shippingCost} onChange={(e) => h.setField("shippingCost", e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ship Date</Label>
                <Input type="date" value={h.form.shipDate} onChange={(e) => h.setField("shipDate", e.target.value)} />
              </div>
              <div>
                <Label>Estimated Delivery</Label>
                <Input type="date" value={h.form.estimatedDelivery} onChange={(e) => h.setField("estimatedDelivery", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={h.form.status} onValueChange={(v) => h.setField("status", v)}>
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
                  <Input value={h.form.shipToName} onChange={(e) => h.setField("shipToName", e.target.value)} />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input value={h.form.shipToCompany} onChange={(e) => h.setField("shipToCompany", e.target.value)} />
                </div>
              </div>
              <div className="mt-3">
                <Label>Address</Label>
                <Textarea value={h.form.shipToAddress} onChange={(e) => h.setField("shipToAddress", e.target.value)} rows={2} />
              </div>
              <div className="mt-3">
                <Label>Phone</Label>
                <Input value={h.form.shipToPhone} onChange={(e) => h.setField("shipToPhone", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={h.form.notes} onChange={(e) => h.setField("notes", e.target.value)} rows={2} placeholder="Internal notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => h.setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={h.handleSave} disabled={h.isSaving}>
              {h.isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : h.editingShipment ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {h.editingShipment ? "Update" : "Create"} Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!h.deleteTarget} onOpenChange={(open) => !open && h.setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" /> Delete Shipment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {h.deleteTarget?.carrier && <span>Carrier: <strong>{h.deleteTarget.carrier}</strong><br /></span>}
              {h.deleteTarget?.trackingNumber && <span>Tracking: <strong>{h.deleteTarget.trackingNumber}</strong><br /></span>}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={h.deleteMutation.isPending}
              onClick={() => h.deleteTarget && h.deleteMutation.mutate(h.deleteTarget.id, { onSuccess: () => h.setDeleteTarget(null) })}
            >
              {h.deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
