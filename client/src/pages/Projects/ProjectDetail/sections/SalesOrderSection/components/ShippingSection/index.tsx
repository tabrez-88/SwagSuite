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
  Edit2,
  Loader2,
  Mail,
  MapPin,
  Package, Pencil,
  Pin,
  Plus,
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
import { ShippingEditDialog } from "./components/ShippingEditDialog";
import { ShipmentTrackingCard } from "./components/ShipmentTrackingCard";

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

              {/* Products Table */}
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
                      <th className="text-left p-2.5 font-medium text-xs">Supplier IHD</th>
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
                              const itemDate = item.shipInHandsDate || hook.order?.supplierInHandsDate;
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

          {/* SECTION 2: SHIPMENT TRACKING */}
          <ShipmentTrackingCard
            shipments={hook.shipments}
            shipmentsLoading={hook.shipmentsLoading}
            showShipmentTracking={hook.showShipmentTracking}
            isLocked={isLocked}
            deliveredCount={hook.deliveredCount}
            totalShippingCost={hook.totalShippingCost}
            getTrackingUrl={hook.getTrackingUrl}
            openNew={hook.openNew}
            openEdit={hook.openEdit}
            setDeleteTarget={hook.setDeleteTarget}
            setNotifyShipment={hook.setNotifyShipment}
          />
        </CardContent>
      </Card>

      {/* EDIT SHIPPING DIALOG */}
      <ShippingEditDialog
        open={!!hook.editingItemId}
        onClose={hook.closeEditDialog}
        itemName={hook.editingItem?.productName || "Product"}
        form={hook.editShippingForm}
        setForm={hook.setEditShippingForm}
        onSave={hook.handleEditSave}
        isSaving={hook.updateItemShippingMutation.isPending}
        companyAddresses={hook.companyAddresses}
        supplierAddresses={hook.supplierAddresses}
        selectStoredAddress={hook.selectStoredAddress}
        updateAddressField={hook.updateAddressField}
        handleDestinationChange={hook.handleDestinationChange}
        handleLeg2ShipToChange={hook.handleLeg2ShipToChange}
        allShippingAccounts={hook.allShippingAccounts}
        filteredMethods={hook.filteredMethods}
      />

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
                <Label className="text-xs">Supplier In-Hands Date</Label>
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
