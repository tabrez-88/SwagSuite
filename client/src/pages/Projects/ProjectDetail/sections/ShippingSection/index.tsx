import EmailComposer from "@/components/email/EmailComposer";
import TimelineWarningBanner from "@/components/shared/TimelineWarningBanner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent,
  DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getDateStatus } from "@/lib/dateUtils";
import { sendCommunication } from "@/services/communications";
import { useUpdateProject } from "@/services/projects/mutations";
import {
  AlertTriangle,
  Bell, BellOff,
  Calendar,
  CheckCircle2,
  ChevronDown, ChevronUp,
  Clock,
  Edit2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Package, Pencil,
  Pin,
  Plus,
  Save,
  Send,
  Trash2,
  Truck,
} from "lucide-react";
import { useShippingSection } from "./hooks";
import type { ShippingSectionProps } from "./types";
import {
  ACCOUNT_TYPE_OPTIONS,
  CARRIERS,
  SHIP_TO_OPTIONS,
  SHIPPING_METHOD_OPTIONS,
  STATUS_OPTIONS,
} from "./types";

function getStatusBadge(status: string | null) {
  const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
  return <Badge className={`${opt.color} text-xs`}>{opt.label}</Badge>;
}

const fmtDate = (d: string | Date | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "--";

const getShipToLabel = (dest: string) => SHIP_TO_OPTIONS.find(o => o.value === dest)?.label || dest || "--";

export default function ShippingSection({ projectId, data, isLocked }: ShippingSectionProps) {
  const h = useShippingSection(projectId, data);
  const updateProjectMutation = useUpdateProject(projectId);

  return (
    <div className="space-y-5 p-6 mt-6 rounded-lg border bg-card text-card-foreground shadow-sm"> 
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Truck className="w-5 h-5" /> Shipping
        </h2>
        <TooltipProvider>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  {(h.order as any)?.enableShippingNotifications !== false ? (
                    <Bell className="w-4 h-4 text-blue-600" />
                  ) : (
                    <BellOff className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-xs text-muted-foreground">Notifications</span>
                  <Switch
                    checked={(h.order as any)?.enableShippingNotifications !== false}
                    onCheckedChange={(checked) =>
                      updateProjectMutation.mutate({ enableShippingNotifications: checked })
                    }
                    disabled={isLocked}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Auto-notify client when shipments are scheduled, shipped, or delivered</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Mail className={`w-4 h-4 ${(h.order as any)?.enableTrackingEmails ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className="text-xs text-muted-foreground">Tracking Emails</span>
                  <Switch
                    checked={(h.order as any)?.enableTrackingEmails === true}
                    onCheckedChange={(checked) =>
                      updateProjectMutation.mutate({ enableTrackingEmails: checked })
                    }
                    disabled={isLocked}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Auto-send tracking update emails to client during delivery (in transit, out for delivery, etc.)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <TimelineWarningBanner conflicts={h.timelineConflicts} />

      {/* Key Dates Context */}
      {(h.order as any)?.inHandsDate && (
        <Card className="bg-blue-50/60 border-blue-100">
          <CardContent className="p-3">
            <div className="flex items-center gap-6 text-xs">
              <span className="text-blue-700">
                <Calendar className="w-3 h-3 inline mr-1" />
                Customer In-Hands: <strong>{fmtDate((h.order as any).inHandsDate)}</strong>
              </span>
              {(h.order as any).supplierInHandsDate && (
                <span className="text-blue-700">
                  Supplier In-Hands: <strong>{fmtDate((h.order as any).supplierInHandsDate)}</strong>
                </span>
              )}
              {(h.order as any).eventDate && (
                <span className="text-blue-700">
                  Event: <strong>{fmtDate((h.order as any).eventDate)}</strong>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 1: SHIPPING DETAILS TABLE */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold flex items-center gap-1.5">
                <Package className="w-4 h-4 text-gray-400" />
                Shipping Details
              </h3>
              <Badge variant={h.shippingProgress.configured === h.shippingProgress.total ? "default" : "secondary"} className="text-xs">
                {h.shippingProgress.configured}/{h.shippingProgress.total} configured
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {h.suppliers.length > 1 && (
                <Select value={h.supplierFilter} onValueChange={h.setSupplierFilter}>
                  <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="All Suppliers" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {h.suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {h.selectedItems.size > 0 && (
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => h.setBulkEditOpen(true)} disabled={isLocked}>
                  <Pencil className="w-3 h-3 mr-1" /> Edit {h.selectedItems.size} Selected
                </Button>
              )}
            </div>
          </div>

          {/* Products Table — read-only with Edit button */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-2.5 w-8">
                    <Checkbox
                      checked={h.selectedItems.size === h.filteredItems.length && h.filteredItems.length > 0}
                      onCheckedChange={h.toggleSelectAll}
                    />
                  </th>
                  <th className="text-left p-2.5 font-medium text-xs">Product</th>
                  <th className="text-left p-2.5 font-medium text-xs">Ship To</th>
                  <th className="text-left p-2.5 font-medium text-xs">Address</th>
                  <th className="text-left p-2.5 font-medium text-xs">In-Hands</th>
                  <th className="text-left p-2.5 font-medium text-xs">Method</th>
                  <th className="p-2.5 w-8"></th>
                  <th className="p-2.5 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {h.filteredItems.map((item: any) => {
                  const isConfigured = item.shippingDestination && item.shipToAddress;
                  const addrSummary = h.getAddressSummary(item.shipToAddress);
                  const dateStatus = item.shipInHandsDate ? getDateStatus(item.shipInHandsDate) : null;

                  return (
                    <tr key={item.id} className={`border-b last:border-0 ${!isConfigured ? "bg-amber-50/50" : ""}`}>
                      <td className="p-2.5">
                        <Checkbox
                          checked={h.selectedItems.has(item.id)}
                          onCheckedChange={() => h.toggleItem(item.id)}
                        />
                      </td>
                      <td className="p-2.5">
                        <p className="text-xs font-medium truncate max-w-[180px]">{item.productName || "Unnamed"}</p>
                        <p className="text-[10px] text-gray-400">{h.getSupplierName(item.supplierId)}</p>
                      </td>
                      <td className="p-2.5">
                        {item.shippingDestination ? (
                          <Badge variant="outline" className="text-[10px]">
                            {getShipToLabel(item.shippingDestination)}
                            {item.shippingDestination === "decorator" && " → Client"}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-amber-600">Not set</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {addrSummary ? (
                          <span className="text-[10px] text-gray-600 truncate block max-w-[200px]">{addrSummary}</span>
                        ) : (
                          <span className="text-[10px] text-amber-600">No address</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {(() => {
                          const itemDate = item.shipInHandsDate || (h.order as any)?.inHandsDate;
                          const isFromOrder = !item.shipInHandsDate && itemDate;
                          const ds = itemDate ? getDateStatus(itemDate) : null;
                          return itemDate ? (
                            <div className="flex items-center gap-1">
                              <span className={`text-[10px] font-medium px-2 py-1 rounded ${isFromOrder ? "text-gray-400" : ds?.color || ""}`}>
                                {fmtDate(itemDate)}
                              </span>
                              {isFromOrder && <span className="text-[9px] text-gray-400">(order)</span>}
                              {item.shipFirm && <Pin className="w-2.5 h-2.5 text-blue-500" />}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400">--</span>
                          );
                        })()}
                      </td>
                      <td className="p-2.5">
                        <span className="text-[10px] text-gray-600">{item.shippingMethodOverride || "--"}</span>
                      </td>
                      <td className="p-2.5">
                        {isConfigured ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                      </td>
                      <td className="p-2.5">
                        <Button variant="outline" size="sm" className="h-7 text-[10px]" disabled={isLocked}
                          onClick={() => h.openEditDialog(item)}>
                          <Pencil className="w-3 h-3 mr-0.5" /> Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {h.shippingProgress.configured < h.shippingProgress.total && (
            <div className="mt-3 text-xs text-amber-700 flex items-center gap-1.5 bg-amber-50 rounded-md p-2.5 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{h.shippingProgress.total - h.shippingProgress.configured} product(s) still need shipping details. POs cannot be generated until all products are configured.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: SHIPMENT TRACKING (kept same) */}
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
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
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
                                {s.shipDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Ship: {fmtDate(s.shipDate)}</span>}
                                {s.estimatedDelivery && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ETA: {fmtDate(s.estimatedDelivery)}</span>}
                                {s.actualDelivery && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Delivered: {fmtDate(s.actualDelivery)}</span>}
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
                              {s.trackingNumber && (
                                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => h.setNotifyShipment(s)}>
                                  <Send className="w-3 h-3" /> Notify Client
                                </Button>
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
                <Card className="bg-blue-50/60">
                  <CardContent className="p-4">
                    <dl className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-5">
                        <div><dt className="text-gray-500 text-xs">Shipments</dt><dd className="font-semibold">{h.shipments.length}</dd></div>
                        <div><dt className="text-gray-500 text-xs">Delivered</dt><dd className="font-semibold text-green-600">{h.deliveredCount} / {h.shipments.length}</dd></div>
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

      {/* ═══ EDIT SHIPPING DIALOG ═══ */}
      <Dialog open={!!h.editingItemId} onOpenChange={(open) => !open && h.closeEditDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Shipping Config — {h.editingItem?.productName || "Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* ── LEG 1 ── */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">
                Leg 1: To {getShipToLabel(h.editShippingForm.shippingDestination) || "Destination"}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ship To *</Label>
                  <Select value={h.editShippingForm.shippingDestination}
                    onValueChange={(v) => h.handleDestinationChange(v)}>
                    <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                    <SelectContent>
                      {SHIP_TO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select value={h.editShippingForm.shippingAccountType}
                    onValueChange={(v) => h.setEditShippingForm(f => ({ ...f, shippingAccountType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address Picker */}
              <div>
                <Label>Address</Label>
                {(() => {
                  const addresses = h.editShippingForm.shippingDestination === "client"
                    ? h.companyAddresses
                    : h.supplierAddresses;
                  return addresses.length > 0 ? (
                    <Select value={h.editShippingForm.shipToAddressId}
                      onValueChange={(v) => {
                        const addr = addresses.find((a: any) => a.id === v);
                        if (addr) h.selectStoredAddress(addr, "leg1");
                      }}>
                      <SelectTrigger className="mb-2"><SelectValue placeholder="Select from saved addresses..." /></SelectTrigger>
                      <SelectContent>
                        {addresses.map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.addressName || a.companyNameOnDocs || "Address"} — {[a.street, a.city, a.state].filter(Boolean).join(", ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null;
                })()}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Input className="h-7 text-xs" placeholder="Street" value={h.editShippingForm.shipToAddress?.street || ""}
                    onChange={(e) => h.updateAddressField("leg1", "street", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="Street 2" value={h.editShippingForm.shipToAddress?.street2 || ""}
                    onChange={(e) => h.updateAddressField("leg1", "street2", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="City" value={h.editShippingForm.shipToAddress?.city || ""}
                    onChange={(e) => h.updateAddressField("leg1", "city", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="State" value={h.editShippingForm.shipToAddress?.state || ""}
                    onChange={(e) => h.updateAddressField("leg1", "state", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="Zip Code" value={h.editShippingForm.shipToAddress?.zipCode || ""}
                    onChange={(e) => h.updateAddressField("leg1", "zipCode", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="Country" value={h.editShippingForm.shipToAddress?.country || ""}
                    onChange={(e) => h.updateAddressField("leg1", "country", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="Contact Name" value={h.editShippingForm.shipToAddress?.contactName || ""}
                    onChange={(e) => h.updateAddressField("leg1", "contactName", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="Phone" value={h.editShippingForm.shipToAddress?.phone || ""}
                    onChange={(e) => h.updateAddressField("leg1", "phone", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>In-Hands Date</Label>
                  <Input type="date" value={h.editShippingForm.shipInHandsDate}
                    onChange={(e) => h.setEditShippingForm(f => ({ ...f, shipInHandsDate: e.target.value }))} />
                </div>
                <div className="flex items-end gap-2 pb-0.5">
                  <Checkbox checked={h.editShippingForm.shipFirm}
                    onCheckedChange={(c) => h.setEditShippingForm(f => ({ ...f, shipFirm: !!c }))} />
                  <Label className="font-normal text-sm">Firm</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Shipping Method</Label>
                  <Select value={h.editShippingForm.shippingMethodOverride}
                    onValueChange={(v) => h.setEditShippingForm(f => ({ ...f, shippingMethodOverride: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                      {SHIPPING_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={h.editShippingForm.shippingNotes}
                    onChange={(e) => h.setEditShippingForm(f => ({ ...f, shippingNotes: e.target.value }))} placeholder="Supplier notes..." />
                </div>
              </div>
            </div>

            {/* ── LEG 2 (only for decorator) ── */}
            {h.editShippingForm.shippingDestination === "decorator" && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-semibold text-purple-700">
                  Leg 2: Decorator → {getShipToLabel(h.editShippingForm.leg2ShipTo)}
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Ship To</Label>
                    <Select value={h.editShippingForm.leg2ShipTo}
                      onValueChange={(v) => h.setEditShippingForm(f => ({ ...f, leg2ShipTo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="fulfillment">Fulfillment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <Select value={h.editShippingForm.leg2ShippingAccountType}
                      onValueChange={(v) => h.setEditShippingForm(f => ({ ...f, leg2ShippingAccountType: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Leg 2 Address Picker (from company addresses) */}
                <div>
                  <Label>Delivery Address</Label>
                  {h.companyAddresses.length > 0 && (
                    <Select value={h.editShippingForm.leg2AddressId}
                      onValueChange={(v) => {
                        const addr = h.companyAddresses.find((a: any) => a.id === v);
                        if (addr) h.selectStoredAddress(addr, "leg2");
                      }}>
                      <SelectTrigger className="mb-2"><SelectValue placeholder="Select from saved addresses..." /></SelectTrigger>
                      <SelectContent>
                        {h.companyAddresses.map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.addressName || "Address"} — {[a.street, a.city, a.state].filter(Boolean).join(", ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Input className="h-7 text-xs" placeholder="Street" value={h.editShippingForm.leg2Address?.street || ""}
                      onChange={(e) => h.updateAddressField("leg2", "street", e.target.value)} />
                    <Input className="h-7 text-xs" placeholder="City" value={h.editShippingForm.leg2Address?.city || ""}
                      onChange={(e) => h.updateAddressField("leg2", "city", e.target.value)} />
                    <Input className="h-7 text-xs" placeholder="State" value={h.editShippingForm.leg2Address?.state || ""}
                      onChange={(e) => h.updateAddressField("leg2", "state", e.target.value)} />
                    <Input className="h-7 text-xs" placeholder="Zip Code" value={h.editShippingForm.leg2Address?.zipCode || ""}
                      onChange={(e) => h.updateAddressField("leg2", "zipCode", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>In-Hands Date</Label>
                    <Input type="date" value={h.editShippingForm.leg2InHandsDate}
                      onChange={(e) => h.setEditShippingForm(f => ({ ...f, leg2InHandsDate: e.target.value }))} />
                  </div>
                  <div className="flex items-end gap-2 pb-0.5">
                    <Checkbox checked={h.editShippingForm.leg2Firm}
                      onCheckedChange={(c) => h.setEditShippingForm(f => ({ ...f, leg2Firm: !!c }))} />
                    <Label className="font-normal text-sm">Firm</Label>
                  </div>
                  <div>
                    <Label>Method</Label>
                    <Select value={h.editShippingForm.leg2ShippingMethod}
                      onValueChange={(v) => h.setEditShippingForm(f => ({ ...f, leg2ShippingMethod: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {SHIPPING_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={h.closeEditDialog}>Cancel</Button>
            <Button onClick={h.handleEditSave} disabled={h.updateItemShippingMutation.isPending}>
              {h.updateItemShippingMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BULK EDIT DIALOG */}
      <Dialog open={h.bulkEditOpen} onOpenChange={(open) => !open && h.setBulkEditOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit Shipping — {h.selectedItems.size} items</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Only filled fields will be updated. Empty fields left unchanged.</p>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Ship To</Label>
              <Select value={h.bulkForm.shippingDestination} onValueChange={(v) => h.setBulkForm(p => ({ ...p, shippingDestination: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="(no change)" /></SelectTrigger>
                <SelectContent>{SHIP_TO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Account Type</Label>
              <Select value={h.bulkForm.shippingAccountType} onValueChange={(v) => h.setBulkForm(p => ({ ...p, shippingAccountType: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="(no change)" /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Shipping Method</Label>
              <Select value={h.bulkForm.shippingMethodOverride} onValueChange={(v) => h.setBulkForm(p => ({ ...p, shippingMethodOverride: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="(no change)" /></SelectTrigger>
                <SelectContent>{SHIPPING_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">In-Hands Date</Label>
                <Input type="date" className="h-8 text-sm" value={h.bulkForm.shipInHandsDate}
                  onChange={(e) => h.setBulkForm(p => ({ ...p, shipInHandsDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea className="text-sm" rows={2} placeholder="(no change)"
                value={h.bulkForm.shippingNotes} onChange={(e) => h.setBulkForm(p => ({ ...p, shippingNotes: e.target.value }))} />
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
                  <SelectContent>{CARRIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
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
            <div>
              <Label>Ship Date</Label>
              <Input type="date" value={h.form.shipDate} onChange={(e) => h.setField("shipDate", e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={h.form.status} onValueChange={(v) => h.setField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> Ship-To Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contact Name</Label><Input value={h.form.shipToName} onChange={(e) => h.setField("shipToName", e.target.value)} /></div>
                <div><Label>Company</Label><Input value={h.form.shipToCompany} onChange={(e) => h.setField("shipToCompany", e.target.value)} /></div>
              </div>
              <div className="mt-3"><Label>Address</Label><Textarea value={h.form.shipToAddress} onChange={(e) => h.setField("shipToAddress", e.target.value)} rows={2} /></div>
              <div className="mt-3"><Label>Phone</Label><Input value={h.form.shipToPhone} onChange={(e) => h.setField("shipToPhone", e.target.value)} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={h.form.notes} onChange={(e) => h.setField("notes", e.target.value)} rows={2} placeholder="Internal notes..." /></div>
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

      {/* NOTIFY CLIENT EMAIL DIALOG */}
      <Dialog open={!!h.notifyShipment} onOpenChange={(open) => !open && h.setNotifyShipment(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" /> Send Tracking Info to Client
            </DialogTitle>
          </DialogHeader>
          {h.notifyShipment && (() => {
            const notifyEmail = h.getNotifyEmail(h.notifyShipment);
            return (
            <EmailComposer
              defaults={{
                to: h.primaryContact?.email || "",
                toName: h.primaryContact ? `${h.primaryContact.firstName} ${h.primaryContact.lastName}` : h.companyName || "",
                subject: notifyEmail.subject,
                body: notifyEmail.body,
              }}
              templateType="shipping_notification"
              templateMergeData={notifyEmail.mergeData}
              autoFillSender
              richText
              showAttachments
              contextProjectId={projectId}
              onSend={async (formData) => {
                const userAttachments = formData.attachments?.length
                  ? formData.attachments.map((att) => ({ fileUrl: att.cloudinaryUrl, fileName: att.fileName }))
                  : undefined;

                await sendCommunication(projectId, {
                  communicationType: "client_email",
                  direction: "sent",
                  recipientEmail: formData.to,
                  recipientName: formData.toName,
                  subject: formData.subject,
                  body: formData.body,
                  cc: formData.cc || undefined,
                  bcc: formData.bcc || undefined,
                  additionalAttachments: userAttachments,
                });
                h.setNotifyShipment(null);
              }}
              onCancel={() => h.setNotifyShipment(null)}
              sendLabel="Send Tracking Email"
            />
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!h.deleteTarget} onOpenChange={(open) => !open && h.setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" /> Delete Shipment?</AlertDialogTitle>
            <AlertDialogDescription>
              {h.deleteTarget?.carrier && <span>Carrier: <strong>{h.deleteTarget.carrier}</strong><br /></span>}
              {h.deleteTarget?.trackingNumber && <span>Tracking: <strong>{h.deleteTarget.trackingNumber}</strong><br /></span>}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={h.deleteMutation.isPending}
              onClick={() => h.deleteTarget && h.deleteMutation.mutate(h.deleteTarget.id, { onSuccess: () => h.setDeleteTarget(null) })}>
              {h.deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
