import EmailComposer from "@/components/email/EmailComposer";
import TimelineWarningBanner from "@/components/shared/TimelineWarningBanner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { ShippingSectionProps, ShippingAddressData } from "./types";
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
  const hook = useShippingSection(projectId, data);
  const updateProjectMutation = useUpdateProject(projectId);

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="w-4 h-4" /> Shipping
            </CardTitle>
            <TooltipProvider>
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      {hook.order?.enableShippingNotifications !== false ? (
                        <Bell className="w-4 h-4 text-blue-600" />
                      ) : (
                        <BellOff className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-xs text-muted-foreground">Notifications</span>
                      <Switch
                        checked={hook.order?.enableShippingNotifications !== false}
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
                      <Mail className={`w-4 h-4 ${hook.order?.enableTrackingEmails ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className="text-xs text-muted-foreground">Tracking Emails</span>
                      <Switch
                        checked={hook.order?.enableTrackingEmails === true}
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
        </CardHeader>
        <CardContent className="space-y-6">

          <TimelineWarningBanner conflicts={hook.timelineConflicts} />

          {/* Key Dates Context */}
          {hook.order?.inHandsDate && (
            <Card className="bg-blue-50/60 border-blue-100">
              <CardContent className="p-3">
                <div className="flex items-center gap-6 text-xs">
                  <span className="text-blue-700">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Customer In-Hands: <strong>{fmtDate(hook.order!.inHandsDate)}</strong>
                  </span>
                  {hook.order!.supplierInHandsDate && (
                    <span className="text-blue-700">
                      Supplier In-Hands: <strong>{fmtDate(hook.order!.supplierInHandsDate)}</strong>
                    </span>
                  )}
                  {hook.order!.eventDate && (
                    <span className="text-blue-700">
                      Event: <strong>{fmtDate(hook.order!.eventDate)}</strong>
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
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    Shipping Details
                  </CardTitle>
                  <Badge variant={hook.shippingProgress.configured === hook.shippingProgress.total ? "default" : "secondary"} className="text-xs">
                    {hook.shippingProgress.configured}/{hook.shippingProgress.total} configured
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {hook.suppliers.length > 1 && (
                    <Select value={hook.supplierFilter} onValueChange={hook.setSupplierFilter}>
                      <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="All Suppliers" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {hook.suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  {hook.selectedItems.size > 0 && (
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => hook.setBulkEditOpen(true)} disabled={isLocked}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit {hook.selectedItems.size} Selected
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
                          checked={hook.selectedItems.size === hook.filteredItems.length && hook.filteredItems.length > 0}
                          onCheckedChange={hook.toggleSelectAll}
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
                    {hook.filteredItems.map((item) => {
                      const isConfigured = item.shippingDestination && item.shipToAddress;
                      const addrSummary = hook.getAddressSummary(item.shipToAddress as ShippingAddressData | null);
                      const dateStatus = item.shipInHandsDate ? getDateStatus(item.shipInHandsDate) : null;

                      return (
                        <tr key={item.id} className={`border-b last:border-0 ${!isConfigured ? "bg-amber-50/50" : ""}`}>
                          <td className="p-2.5">
                            <Checkbox
                              checked={hook.selectedItems.has(item.id)}
                              onCheckedChange={() => hook.toggleItem(item.id)}
                            />
                          </td>
                          <td className="p-2.5">
                            <p className="text-xs font-medium truncate max-w-[180px]">{item.productName || "Unnamed"}</p>
                            <p className="text-[10px] text-gray-400">{hook.getSupplierName(item.supplierId)}</p>
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
                              const itemDate = item.shipInHandsDate || hook.order?.inHandsDate;
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
                              onClick={() => hook.openEditDialog(item)}>
                              <Pencil className="w-3 h-3 mr-0.5" /> Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hook.shippingProgress.configured < hook.shippingProgress.total && (
                <div className="mt-3 text-xs text-amber-700 flex items-center gap-1.5 bg-amber-50 rounded-md p-2.5 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{hook.shippingProgress.total - hook.shippingProgress.configured} product(s) still need shipping details. POs cannot be generated until all products are configured.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 2: SHIPMENT TRACKING (kept same) */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    Shipment Tracking
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {hook.shipments.length} shipment{hook.shipments.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={hook.openNew} disabled={isLocked}>
                    <Plus className="w-4 h-4 mr-2" /> Add Shipment
                  </Button>
                </div>
              </div>
              {hook.showShipmentTracking && (
                <div className="space-y-3 mt-2">
                  {hook.shipmentsLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                  ) : hook.shipments.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">No shipments yet</h3>
                        <p className="text-sm text-gray-500">Shipments will appear here once orders are shipped</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {hook.shipments.map((s) => {
                          const trackUrl = hook.getTrackingUrl(s.carrier, s.trackingNumber);
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
                                      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => hook.setNotifyShipment(s)}>
                                        <Send className="w-3 h-3" /> Notify Client
                                      </Button>
                                    )}
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isLocked} onClick={() => hook.openEdit(s)}>
                                        <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isLocked} onClick={() => hook.setDeleteTarget(s)}>
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
                              <div><dt className="text-gray-500 text-xs">Shipments</dt><dd className="font-semibold">{hook.shipments.length}</dd></div>
                              <div><dt className="text-gray-500 text-xs">Delivered</dt><dd className="font-semibold text-green-600">{hook.deliveredCount} / {hook.shipments.length}</dd></div>
                            </div>
                            <div className="text-right">
                              <dt className="text-xs text-gray-500">Total Shipping</dt>
                              <dd className="text-lg font-bold text-blue-600">${hook.totalShippingCost.toFixed(2)}</dd>
                            </div>
                          </dl>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* ═══ EDIT SHIPPING DIALOG ═══ */}
      <Dialog open={!!hook.editingItemId} onOpenChange={(open) => !open && hook.closeEditDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Shipping Config — {hook.editingItem?.productName || "Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* ── LEG 1 ── */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">
                Leg 1: To {getShipToLabel(hook.editShippingForm.shippingDestination) || "Destination"}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ship To *</Label>
                  <Select value={hook.editShippingForm.shippingDestination}
                    onValueChange={(v) => hook.handleDestinationChange(v)}>
                    <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                    <SelectContent>
                      {SHIP_TO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select value={hook.editShippingForm.shippingAccountType}
                    onValueChange={(v) => hook.setEditShippingForm(f => ({ ...f, shippingAccountType: v }))}>
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
                  const addresses = hook.editShippingForm.shippingDestination === "client"
                    ? hook.companyAddresses
                    : hook.supplierAddresses;
                  return addresses.length > 0 ? (
                    <Select value={hook.editShippingForm.shipToAddressId}
                      onValueChange={(v) => {
                        const addr = addresses.find((a) => a.id === v);
                        if (addr) hook.selectStoredAddress(addr, "leg1");
                      }}>
                      <SelectTrigger className="mb-2"><SelectValue placeholder="Select from saved addresses..." /></SelectTrigger>
                      <SelectContent>
                        {addresses.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.addressName || a.companyNameOnDocs || "Address"} — {[a.street, a.city, a.state].filter(Boolean).join(", ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null;
                })()}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Input className="h-7 text-xs" placeholder="Street" value={hook.editShippingForm.shipToAddress?.street || ""}
                    onChange={(e) => hook.updateAddressField("leg1", "street", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="Street 2" value={hook.editShippingForm.shipToAddress?.street2 || ""}
                    onChange={(e) => hook.updateAddressField("leg1", "street2", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="City" value={hook.editShippingForm.shipToAddress?.city || ""}
                    onChange={(e) => hook.updateAddressField("leg1", "city", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="State" value={hook.editShippingForm.shipToAddress?.state || ""}
                    onChange={(e) => hook.updateAddressField("leg1", "state", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="Zip Code" value={hook.editShippingForm.shipToAddress?.zipCode || ""}
                    onChange={(e) => hook.updateAddressField("leg1", "zipCode", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="Country" value={hook.editShippingForm.shipToAddress?.country || ""}
                    onChange={(e) => hook.updateAddressField("leg1", "country", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="Contact Name" value={hook.editShippingForm.shipToAddress?.contactName || ""}
                    onChange={(e) => hook.updateAddressField("leg1", "contactName", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="Phone" value={hook.editShippingForm.shipToAddress?.phone || ""}
                    onChange={(e) => hook.updateAddressField("leg1", "phone", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>In-Hands Date</Label>
                  <Input type="date" value={hook.editShippingForm.shipInHandsDate}
                    onChange={(e) => hook.setEditShippingForm(f => ({ ...f, shipInHandsDate: e.target.value }))} />
                </div>
                <div className="flex items-end gap-2 pb-0.5">
                  <Checkbox checked={hook.editShippingForm.shipFirm}
                    onCheckedChange={(c) => hook.setEditShippingForm(f => ({ ...f, shipFirm: !!c }))} />
                  <Label className="font-normal text-sm">Firm</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Shipping Method</Label>
                  <Select value={hook.editShippingForm.shippingMethodOverride}
                    onValueChange={(v) => hook.setEditShippingForm(f => ({ ...f, shippingMethodOverride: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                      {SHIPPING_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={hook.editShippingForm.shippingNotes}
                    onChange={(e) => hook.setEditShippingForm(f => ({ ...f, shippingNotes: e.target.value }))} placeholder="Supplier notes..." />
                </div>
              </div>
            </div>

            {/* ── LEG 2 (only for decorator) ── */}
            {hook.editShippingForm.shippingDestination === "decorator" && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-semibold text-purple-700">
                  Leg 2: Decorator → {getShipToLabel(hook.editShippingForm.leg2ShipTo)}
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Ship To</Label>
                    <Select value={hook.editShippingForm.leg2ShipTo}
                      onValueChange={(v) => hook.handleLeg2ShipToChange(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="fulfillment">Fulfillment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <Select value={hook.editShippingForm.leg2ShippingAccountType}
                      onValueChange={(v) => hook.setEditShippingForm(f => ({ ...f, leg2ShippingAccountType: v }))}>
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
                  {hook.companyAddresses.length > 0 && (
                    <Select value={hook.editShippingForm.leg2AddressId}
                      onValueChange={(v) => {
                        const addr = hook.companyAddresses.find((a) => a.id === v);
                        if (addr) hook.selectStoredAddress(addr, "leg2");
                      }}>
                      <SelectTrigger className="mb-2"><SelectValue placeholder="Select from saved addresses..." /></SelectTrigger>
                      <SelectContent>
                        {hook.companyAddresses.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.addressName || "Address"} — {[a.street, a.city, a.state].filter(Boolean).join(", ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Input className="h-7 text-xs" placeholder="Street" value={hook.editShippingForm.leg2Address?.street || ""}
                      onChange={(e) => hook.updateAddressField("leg2", "street", e.target.value)} />
                    <Input className="h-7 text-xs" placeholder="City" value={hook.editShippingForm.leg2Address?.city || ""}
                      onChange={(e) => hook.updateAddressField("leg2", "city", e.target.value)} />
                    <Input className="h-7 text-xs" placeholder="State" value={hook.editShippingForm.leg2Address?.state || ""}
                      onChange={(e) => hook.updateAddressField("leg2", "state", e.target.value)} />
                    <Input className="h-7 text-xs" placeholder="Zip Code" value={hook.editShippingForm.leg2Address?.zipCode || ""}
                      onChange={(e) => hook.updateAddressField("leg2", "zipCode", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>In-Hands Date</Label>
                    <Input type="date" value={hook.editShippingForm.leg2InHandsDate}
                      onChange={(e) => hook.setEditShippingForm(f => ({ ...f, leg2InHandsDate: e.target.value }))} />
                  </div>
                  <div className="flex items-end gap-2 pb-0.5">
                    <Checkbox checked={hook.editShippingForm.leg2Firm}
                      onCheckedChange={(c) => hook.setEditShippingForm(f => ({ ...f, leg2Firm: !!c }))} />
                    <Label className="font-normal text-sm">Firm</Label>
                  </div>
                  <div>
                    <Label>Method</Label>
                    <Select value={hook.editShippingForm.leg2ShippingMethod}
                      onValueChange={(v) => hook.setEditShippingForm(f => ({ ...f, leg2ShippingMethod: v }))}>
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
            <Button variant="outline" onClick={hook.closeEditDialog}>Cancel</Button>
            <Button onClick={hook.handleEditSave} disabled={hook.updateItemShippingMutation.isPending}>
              {hook.updateItemShippingMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BULK EDIT DIALOG */}
      <Dialog open={hook.bulkEditOpen} onOpenChange={(open) => !open && hook.setBulkEditOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit Shipping — {hook.selectedItems.size} items</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Only filled fields will be updated. Empty fields left unchanged.</p>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Ship To</Label>
              <Select value={hook.bulkForm.shippingDestination} onValueChange={(v) => hook.setBulkForm(p => ({ ...p, shippingDestination: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="(no change)" /></SelectTrigger>
                <SelectContent>{SHIP_TO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Account Type</Label>
              <Select value={hook.bulkForm.shippingAccountType} onValueChange={(v) => hook.setBulkForm(p => ({ ...p, shippingAccountType: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="(no change)" /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Shipping Method</Label>
              <Select value={hook.bulkForm.shippingMethodOverride} onValueChange={(v) => hook.setBulkForm(p => ({ ...p, shippingMethodOverride: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="(no change)" /></SelectTrigger>
                <SelectContent>{SHIPPING_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">In-Hands Date</Label>
                <Input type="date" className="h-8 text-sm" value={hook.bulkForm.shipInHandsDate}
                  onChange={(e) => hook.setBulkForm(p => ({ ...p, shipInHandsDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea className="text-sm" rows={2} placeholder="(no change)"
                value={hook.bulkForm.shippingNotes} onChange={(e) => hook.setBulkForm(p => ({ ...p, shippingNotes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => hook.setBulkEditOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={hook.handleBulkEdit} disabled={hook.updateItemShippingMutation.isPending}>
              {hook.updateItemShippingMutation.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              Update {hook.selectedItems.size} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SHIPMENT FORM DIALOG */}
      <Dialog open={hook.isFormOpen} onOpenChange={(open) => !open && hook.setIsFormOpen(false)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{hook.editingShipment ? "Edit Shipment" : "Add Shipment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Carrier</Label>
                <Select value={hook.form.carrier} onValueChange={(v) => hook.setField("carrier", v)}>
                  <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>{CARRIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tracking Number</Label>
                <Input value={hook.form.trackingNumber} onChange={(e) => hook.setField("trackingNumber", e.target.value)} placeholder="Enter tracking #" />
              </div>
              <div>
                <Label>Shipping Cost</Label>
                <Input type="number" step="0.01" min={0} value={hook.form.shippingCost} onChange={(e) => hook.setField("shippingCost", e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label>Ship Date</Label>
              <Input type="date" value={hook.form.shipDate} onChange={(e) => hook.setField("shipDate", e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={hook.form.status} onValueChange={(v) => hook.setField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> Ship-To Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contact Name</Label><Input value={hook.form.shipToName} onChange={(e) => hook.setField("shipToName", e.target.value)} /></div>
                <div><Label>Company</Label><Input value={hook.form.shipToCompany} onChange={(e) => hook.setField("shipToCompany", e.target.value)} /></div>
              </div>
              <div className="mt-3"><Label>Address</Label><Textarea value={hook.form.shipToAddress} onChange={(e) => hook.setField("shipToAddress", e.target.value)} rows={2} /></div>
              <div className="mt-3"><Label>Phone</Label><Input value={hook.form.shipToPhone} onChange={(e) => hook.setField("shipToPhone", e.target.value)} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={hook.form.notes} onChange={(e) => hook.setField("notes", e.target.value)} rows={2} placeholder="Internal notes..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => hook.setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={hook.handleSave} disabled={hook.isSaving}>
              {hook.isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : hook.editingShipment ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {hook.editingShipment ? "Update" : "Create"} Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOTIFY CLIENT EMAIL DIALOG */}
      <Dialog open={!!hook.notifyShipment} onOpenChange={(open) => !open && hook.setNotifyShipment(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" /> Send Tracking Info to Client
            </DialogTitle>
          </DialogHeader>
          {hook.notifyShipment && (() => {
            const notifyEmail = hook.getNotifyEmail(hook.notifyShipment);
            return (
              <EmailComposer
                defaults={{
                  to: hook.primaryContact?.email || "",
                  toName: hook.primaryContact ? `${hook.primaryContact.firstName} ${hook.primaryContact.lastName}` : hook.companyName || "",
                  subject: notifyEmail.subject,
                  body: notifyEmail.body,
                }}
                templateType="shipping_notification"
                templateMergeData={notifyEmail.mergeData}
                autoFillSender
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
                  hook.setNotifyShipment(null);
                }}
                onCancel={() => hook.setNotifyShipment(null)}
                sendLabel="Send Tracking Email"
              />
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!hook.deleteTarget} onOpenChange={(open) => !open && hook.setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" /> Delete Shipment?</AlertDialogTitle>
            <AlertDialogDescription>
              {hook.deleteTarget?.carrier && <span>Carrier: <strong>{hook.deleteTarget.carrier}</strong><br /></span>}
              {hook.deleteTarget?.trackingNumber && <span>Tracking: <strong>{hook.deleteTarget.trackingNumber}</strong><br /></span>}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={hook.deleteMutation.isPending}
              onClick={() => hook.deleteTarget && hook.deleteMutation.mutate(hook.deleteTarget.id, { onSuccess: () => hook.setDeleteTarget(null) })}>
              {hook.deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
