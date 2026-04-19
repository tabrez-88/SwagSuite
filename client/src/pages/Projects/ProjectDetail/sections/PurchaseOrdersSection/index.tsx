import { PdfPreviewDialog } from "@/components/documents/pdf/PdfPreviewDialog";
import EmailComposer from "@/components/email/EmailComposer";
import type { EmailContact } from "@/components/email/types";
import { useAutoFillSender } from "@/components/email/useAutoFillSender";
import { DocumentEditor } from "@/components/feature/DocumentEditor";
import FilePickerDialog from "@/components/modals/FilePickerDialog";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";
import { EditableDate } from "@/components/shared/InlineEditable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useNextActionTypes } from "@/hooks/useNextActionTypes";
import { getCloudinaryThumbnail } from "@/lib/media-library";
import { sendCommunication } from "@/services/communications";
import {
  AlertTriangle, Building2, Calendar, CheckCircle, ChevronDown, ChevronRight,
  ClipboardList, Copy, Download,
  ExternalLink,
  Eye, FileText, Loader2,
  Mail, MoreHorizontal, Package, Palette, Printer, Send, ShieldCheck, Upload
} from "lucide-react";
import { useMemo } from "react";
import { usePurchaseOrdersSection } from "./hooks";
import type { PurchaseOrdersSectionProps } from "./types";

export default function PurchaseOrdersSection({ projectId, data, isLocked }: PurchaseOrdersSectionProps) {
  const hook = usePurchaseOrdersSection({ projectId, data, isLocked });
  const { toast } = useToast();
  const sender = useAutoFillSender();
  const { actionTypes } = useNextActionTypes();

  // Merge data for PO email template
  const poMergeData = useMemo(() => ({
    companyName: hook.data.companyName || "",
    senderName: sender.name || "",
    vendorName: hook.emailPOVendor?.vendor.name || "",
    vendorContactName: hook.emailPOVendor?.vendor.contactPerson || hook.emailPOVendor?.vendor.name || "",
    orderNumber: hook.order?.orderNumber || "",
    poNumber: hook.emailPOVendor?.doc.documentNumber || "",
    supplierInHandsDate: (() => {
      const ihd = (hook.emailPOVendor?.doc?.metadata as Record<string, unknown> | undefined)?.supplierIHD || hook.order?.supplierInHandsDate;
      return ihd ? new Date(ihd as string).toLocaleDateString() : "";
    })(),
  }), [hook.emailPOVendor, hook.order, hook.data, sender]);

  // Merge data for Proof email template
  const proofMergeData = useMemo(() => ({
    companyName: hook.data.companyName || "",
    senderName: sender.name || "",
    recipientName: hook.data.primaryContact ? `${hook.data.primaryContact.firstName} ${hook.data.primaryContact.lastName}` : "",
    recipientFirstName: hook.data.primaryContact?.firstName || "there",
    artworkList: hook.sendProofArts.map((a) => `  - ${a.productName} (${a.location || a.artworkType || "Artwork"})`).join("\n"),
  }), [hook.data, hook.sendProofArts, sender]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Purchase Orders
          </h2>
          <Badge variant="secondary" className="text-xs">
            {hook.vendorPOs.length} vendor{hook.vendorPOs.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        {!hook.isLocked && hook.getAllSendableProofs().length > 0 && (
          <Button variant="default" size="sm" onClick={hook.openSendAllVendorProofs}>
            <Send className="w-4 h-4 mr-1.5" />
            Send All Proofs to Client ({hook.getAllSendableProofs().length})
          </Button>
        )}
      </div>

      {/* Supplier IHD Date Card */}
      <Card className="bg-blue-50/60 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-900">Supplier In-Hands Date</span>
                  <span className="text-red-500 text-xs font-bold">* Required</span>
                </div>
                <p className="text-xs text-blue-600">Default date for all vendors — override per PO below</p>
              </div>
            </div>
            <EditableDate
              value={hook.order?.supplierInHandsDate}
              field="supplierInHandsDate"
              onSave={hook.updateField}
              emptyText="Click to set date"
              isLocked={hook.isLocked}
              isPending={hook.isFieldPending}
            />
          </div>
          {hook.order?.inHandsDate && (
            <div className="mt-2 pt-2 border-t border-blue-200 flex items-center gap-4 text-xs text-blue-700">
              <span>Customer In-Hands: <strong>{new Date(hook.order!.inHandsDate).toLocaleDateString()}</strong></span>
              {hook.order?.eventDate && (
                <span>Event Date: <strong>{new Date(hook.order!.eventDate).toLocaleDateString()}</strong></span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier IHD Warning */}
      {!hook.hasSupplierIHD && hook.orderItems.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Supplier In-Hands Date is required before generating POs. Set the date above.</span>
        </div>
      )}

      {/* Shipping Warnings */}
      {!hook.hasShippingAddress && hook.orderItems.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>No shipping address set. POs require a ship-to address — set it in the Sales Order section.</span>
        </div>
      )}
      {hook.hasShippingAddress && !hook.allShippingConfigured && hook.orderItems.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Not all products have shipping details configured. Complete shipping details in the Shipping tab before generating POs.</span>
        </div>
      )}

      {/* Dual-PO reminder: apparel items with artwork should route through a third-party decorator */}
      {hook.itemsMissingDecorator.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Dual PO workflow recommended</p>
            <p className="text-xs text-blue-800 mt-0.5">
              {hook.itemsMissingDecorator.length} item{hook.itemsMissingDecorator.length > 1 ? "s" : ""} with artwork {hook.itemsMissingDecorator.length > 1 ? "are" : "is"} routed as "Supplier Decorator" — only one PO will be generated.
              For apparel orders that need blanks shipped to a decorator first, edit each product and set <strong>Decorator Type → Third-Party Decorator</strong>. This splits the work into two POs: one for the blanks, one for the decorator.
            </p>
          </div>
        </div>
      )}

      {/* Batch generate all outstanding POs */}
      {hook.vendorPOs.length > 1 && hook.vendorPOs.some((po) => !hook.getVendorDoc(po.vendor.vendorKey || po.vendor.id)) && (
        <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
          <div className="text-sm">
            <p className="font-medium">Generate POs in bulk</p>
            <p className="text-xs text-gray-500">Create PDFs for every vendor that doesn't have one yet.</p>
          </div>
          <Button size="sm" onClick={hook.handleGenerateAllPOs} disabled={hook.isGenerating || !!hook.generatingVendorId || hook.isLocked}>
            {hook.generatingVendorId ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
            Generate All POs
          </Button>
        </div>
      )}

      {/* Empty state */}
      {hook.vendorPOs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors on this order</h3>
            <p className="text-sm text-gray-500">Add products with vendor/supplier info to generate POs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {hook.vendorPOs.map((po) => {
            const vendorKey = po.vendor.vendorKey || po.vendor.id;
            const isDecorator = po.vendor.role === "decorator";
            const isExpanded = hook.expandedVendors.has(vendorKey);
            const vendorDoc = hook.getVendorDoc(vendorKey);
            const isVendorGenerating = hook.generatingVendorId === vendorKey;
            const poStage = vendorDoc ? hook.getDocStage(vendorDoc) : null;
            const poStatus = vendorDoc ? hook.getDocStatus(vendorDoc) : null;
            const stageInfo = poStage ? hook.PO_STAGES[poStage] || hook.PO_STAGES.created : null;
            const statusInfo = poStatus ? hook.PO_STATUSES[poStatus] || hook.PO_STATUSES.ok : null;
            const vendorArtworks = hook.getVendorArtworks(vendorKey);
            const vendorIhdValue = vendorDoc?.metadata?.supplierIHD;
            const effectiveIhd = vendorIhdValue || hook.order?.supplierInHandsDate;

            return (
              <Card key={vendorKey} className="overflow-hidden">
                {/* Vendor header row */}
                <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => hook.toggleVendor(vendorKey)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <Building2 className={`w-5 h-5 ${isDecorator ? "text-purple-500" : "text-blue-500"}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{po.vendor.name}</h3>
                          {isDecorator && <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-600 bg-purple-50">Decorator</Badge>}
                          {stageInfo && <Badge variant="outline" className={`text-[10px] ${stageInfo.color}`}>{stageInfo.label}</Badge>}
                          {statusInfo && poStatus !== "ok" && <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>}
                          {vendorDoc && hook.isVendorDocStale(vendorDoc) && (
                            <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 bg-orange-50">
                              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Outdated
                            </Badge>
                          )}
                          {effectiveIhd ? (
                            <Badge variant="outline" className={`text-[10px] ${vendorIhdValue ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              <Calendar className="w-3 h-3 mr-1" />
                              IHD: {new Date(effectiveIhd).toLocaleDateString()}
                              {vendorIhdValue && <span className="ml-1 text-[8px]">(custom)</span>}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                              No IHD set
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {po.vendor.contactPerson && <span>Attn: {po.vendor.contactPerson}</span>}
                          {po.vendor.email && <span>{po.vendor.email}</span>}
                          {(() => {
                            const addr = hook.getVendorDefaultAddress(po.vendor.id);
                            if (!addr) return null;
                            const parts = [addr.city, addr.state].filter(Boolean).join(", ");
                            return parts ? <span className="text-gray-400">| {parts}</span> : null;
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Items</p>
                        <p className="font-semibold">{po.items.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Qty</p>
                        <p className="font-semibold">{po.totalQty}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Cost</p>
                        <p className="font-semibold text-blue-600">${po.totalCost.toFixed(2)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                          onClick={() => hook.handlePreviewPO(vendorKey)}>
                          <Eye className="w-3 h-3" /> Preview
                        </Button>
                        {!vendorDoc ? (
                          <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                            onClick={() => hook.handleGeneratePO(vendorKey, po.vendor.name)}
                            disabled={isVendorGenerating || hook.isGenerating || hook.isLocked || (!hook.hasSupplierIHD && !isDecorator)}>
                            {isVendorGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                            Generate PO
                          </Button>
                        ) : (
                          <>
                            {hook.isVendorDocStale(vendorDoc) && (
                              <Button variant="destructive" size="sm" className="h-7 text-xs gap-1"
                                onClick={() => hook.handleRegeneratePO(vendorDoc)}
                                disabled={hook.isGenerating || hook.isLocked}>
                                {hook.generatingVendorId ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                                Regenerate PO
                              </Button>
                            )}
                            {poStage === "created" && (
                              <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                                onClick={() => hook.openEmailPO(vendorDoc, po.vendor)} disabled={hook.isLocked}>
                                <Mail className="w-3 h-3" /> Email to Vendor
                              </Button>
                            )}
                            {(poStage === "submitted") && vendorDoc && (
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-green-200 text-green-700"
                                onClick={() => hook.updateDocMetaMutation.mutate({
                                  docId: vendorDoc.id,
                                  updates: { metadata: { ...vendorDoc.metadata, poStage: "confirmed" } },
                                })}
                                disabled={hook.isLocked || hook.updateDocMetaMutation.isPending}>
                                {hook.updateDocMetaMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                Mark Confirmed
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {poStage !== "created" && (
                                  <DropdownMenuItem onClick={() => hook.openEmailPO(vendorDoc, po.vendor)}>
                                    <Mail className="w-4 h-4 mr-2" /> Resend PO
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => hook.handleRegeneratePO(vendorDoc)}
                                  disabled={hook.isGenerating || hook.isLocked}
                                  className="text-orange-600"
                                >
                                  {hook.isGenerating ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Printer className="w-4 h-4 mr-2" />
                                  )}
                                  {hook.isGenerating ? "Regenerating..." : "Regenerate PO"}
                                </DropdownMenuItem>
                                {poStage === "submitted" && (
                                  <DropdownMenuItem onClick={() => hook.updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "confirmed" } },
                                  })}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Confirmed
                                  </DropdownMenuItem>
                                )}
                                {poStage === "confirmed" && (
                                  <DropdownMenuItem onClick={() => hook.updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "shipped" } },
                                  })}>
                                    <Package className="w-4 h-4 mr-2" /> Mark as Shipped
                                  </DropdownMenuItem>
                                )}
                                {poStage === "shipped" && (
                                  <DropdownMenuItem onClick={() => hook.updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "ready_for_billing" } },
                                  })}>
                                    <ClipboardList className="w-4 h-4 mr-2" /> Ready for Billing
                                  </DropdownMenuItem>
                                )}
                                {poStage === "ready_for_billing" && (
                                  <DropdownMenuItem onClick={() => hook.updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "billed" } },
                                  })}>
                                    <FileText className="w-4 h-4 mr-2" /> Mark as Billed
                                  </DropdownMenuItem>
                                )}
                                {poStage === "billed" && (
                                  <DropdownMenuItem onClick={() => hook.updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "closed" } },
                                  })}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Close PO
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded — items + proofing */}
                {isExpanded && (
                  <div className="border-t">
                    {/* PO Stage selector + Supplier IHD */}
                    {vendorDoc && (
                      <div className="border-b p-4 flex items-center gap-4 flex-wrap">
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-1">PO Stage</label>
                          <Select
                            value={hook.getDocStage(vendorDoc)}
                            onValueChange={(val) => hook.updateDocMetaMutation.mutate({
                              docId: vendorDoc.id,
                              updates: { metadata: { ...vendorDoc.metadata, poStage: val } },
                            })}
                            disabled={hook.isLocked}
                          >
                            <SelectTrigger className="h-8 text-xs w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(hook.PO_STAGES).map(([key, val]) => (
                                <SelectItem key={key} value={key}>
                                  <span className="flex items-center gap-2">
                                    <span className={`inline-block w-2 h-2 rounded-full ${val.color.split(" ")[0]}`} />
                                    {val.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-1">PO Status</label>
                          <Select
                            value={hook.getDocStatus(vendorDoc)}
                            onValueChange={(val) => hook.updateDocMetaMutation.mutate({
                              docId: vendorDoc.id,
                              updates: { metadata: { ...vendorDoc.metadata, poStatus: val } },
                            })}
                            disabled={hook.isLocked}
                          >
                            <SelectTrigger className="h-8 text-xs w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(hook.PO_STATUSES).map(([key, val]) => (
                                <SelectItem key={key} value={key}>
                                  <span className="flex items-center gap-2">
                                    <span className={`inline-block w-2 h-2 rounded-full ${val.color.split(" ")[0]}`} />
                                    {val.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-1">Next Action</label>
                          <Select
                            value={vendorDoc.metadata?.nextActionType || ''}
                            onValueChange={(val) => hook.updateDocMetaMutation.mutate({
                              docId: vendorDoc.id,
                              updates: { metadata: { ...vendorDoc.metadata, nextActionType: val } },
                            })}
                            disabled={hook.isLocked}
                          >
                            <SelectTrigger className="h-8 text-xs w-[160px]">
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                              {actionTypes.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-1">Next Action Date</label>
                          <Input
                            type="date"
                            value={vendorDoc.metadata?.nextActionDate || ''}
                            onChange={(e) => hook.updateDocMetaMutation.mutate({
                              docId: vendorDoc.id,
                              updates: { metadata: { ...vendorDoc.metadata, nextActionDate: e.target.value } },
                            })}
                            className="h-8 text-xs w-[160px]"
                            disabled={hook.isLocked}
                          />
                        </div>
                        {hook.order?.inHandsDate && (
                          <div className="text-[10px] text-gray-500 ml-auto">
                            Customer IHD: <strong>{new Date(hook.order!.inHandsDate).toLocaleDateString()}</strong>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Items List */}
                    <div className="bg-gray-50/50">
                      {po.items.map((item, idx: number) => {
                        const itemLines = po.lines[item.id] || [];
                        return (
                          <div key={item.id} className={`px-6 py-3 ${idx < po.items.length - 1 ? "border-b" : ""}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">{item.productName || "Product"}</span>
                                <span className="text-xs text-blue-600">{item.productSku || ""}</span>
                              </div>
                            </div>
                            {itemLines.length > 0 ? (
                              <div className="border rounded bg-white overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-50 border-b">
                                    <tr>
                                      <th className="text-left p-2 font-medium">Color</th>
                                      <th className="text-left p-2 font-medium">Size</th>
                                      <th className="text-right p-2 font-medium">Qty</th>
                                      <th className="text-right p-2 font-medium">Cost</th>
                                      <th className="text-right p-2 font-medium">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {itemLines.map((l) => {
                                      const qty = l.quantity || 0;
                                      const cost = parseFloat(l.cost || "0");
                                      return (
                                        <tr key={l.id} className="border-b last:border-0">
                                          <td className="p-2">{l.color || "--"}</td>
                                          <td className="p-2">{l.size || "--"}</td>
                                          <td className="p-2 text-right font-medium">{qty}</td>
                                          <td className="p-2 text-right">${cost.toFixed(2)}</td>
                                          <td className="p-2 text-right font-medium">${(qty * cost).toFixed(2)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 flex gap-4 ml-6">
                                <span>Qty: <strong>{item.quantity}</strong></span>
                                <span>Cost: <strong>${parseFloat(item.cost || item.unitPrice || "0").toFixed(2)}</strong></span>
                                {item.color && <span>Color: {item.color}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Proofing Section */}
                    {vendorArtworks.length > 0 && (
                      <div className="border-t p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Palette className="w-4 h-4 text-purple-500" />
                            Artwork Proofs
                            <Badge variant="secondary" className="text-[10px]">
                              {vendorArtworks.filter((a) => a.proofRequired !== false && ["approved", "proofing_complete"].includes(a.status)).length}/{vendorArtworks.filter((a) => a.proofRequired !== false).length} approved
                            </Badge>
                          </h4>
                          {!hook.isLocked && vendorArtworks.some((a) => a.proofRequired !== false && a.proofFilePath && ["proof_received", "change_requested"].includes(a.status)) && (
                            <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                              onClick={() => hook.openSendAllProofs(vendorKey)}>
                              <Send className="w-3 h-3" /> Send All Proofs to Client
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {vendorArtworks.map((art) => {
                            const proofRequired = art.proofRequired !== false;
                            const si = hook.PROOF_STATUSES[art.status] || hook.PROOF_STATUSES.pending;
                            const canRequestProof = proofRequired && ["pending", "change_requested"].includes(art.status || "pending");
                            const canUpload = proofRequired && ["pending", "awaiting_proof", "change_requested"].includes(art.status || "pending");
                            const canMarkComplete = proofRequired && art.status === "approved";

                            return (
                              <div key={art.id} className={`rounded-lg border`}>
                                <div className="flex items-center gap-3 p-3">
                                  <div className="w-12 h-12 flex-shrink-0 bg-white rounded border overflow-hidden flex items-center justify-center cursor-pointer"
                                    onClick={() => { const url = (art.fileUrl || art.filePath) as string | undefined; if (url) hook.setPreviewFile({ url, name: (art.name as string) || "Artwork" }); }}>
                                    {art.fileUrl || art.filePath ? (
                                      (() => {
                                        const url = (art.fileUrl || art.filePath) as string;
                                        const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
                                        const isDesignFile = ["ai", "eps", "psd"].includes(ext || "");
                                        const imgSrc = isDesignFile && url.includes("cloudinary.com")
                                          ? getCloudinaryThumbnail(url, 96, 96) : url;
                                        return <img src={imgSrc} alt="" className="w-full h-full object-contain p-0.5"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                            e.currentTarget.parentElement?.insertAdjacentHTML("afterbegin",
                                              `<span class="text-[9px] text-gray-400 uppercase font-medium">.${ext || "file"}</span>`);
                                          }} />;
                                      })()
                                    ) : (
                                      <Palette className="w-5 h-5 text-gray-300" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{art.name || art.fileName}</p>
                                    <p className="text-xs text-gray-500">
                                      {art.productName}
                                      {art.location && <span className="ml-1 text-gray-400">· {art.location}</span>}
                                      {art.artworkType && <span className="ml-1 text-gray-400">· {art.artworkType}</span>}
                                    </p>
                                  </div>

                                  <div className="flex flex-col items-start gap-1.5" title={proofRequired ? "Proof required" : "No proof needed"}>
                                    <div className="flex gap-1 items-center justify-start">
                                      <ShieldCheck className={`w-3.5 h-3.5 ${proofRequired ? "text-blue-500" : "text-gray-300"}`} />
                                      <p className="text-xs">Proof Required </p>
                                    </div>
                                    <div className="flex gap-2 w-full">
                                      <Switch
                                        checked={proofRequired}
                                        onCheckedChange={(checked) => {
                                          hook.updateArtworkMutation.mutate({
                                            artworkId: art.id, orderItemId: art.orderItemId,
                                            updates: { name: art.name, proofRequired: checked },
                                          });
                                        }}
                                        disabled={hook.isLocked}
                                      />
                                      {proofRequired ? (
                                        <Badge className={`text-[10px] ${si.color}`}>{si.label}</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-[10px] text-gray-400">No Proof</Badge>
                                      )}
                                    </div>

                                  </div>

                                </div>

                                {proofRequired && art.proofFilePath && (
                                  <div className="px-3 pb-2">
                                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-md border border-blue-100">
                                      <div className="w-10 h-10 flex-shrink-0 bg-white rounded border overflow-hidden cursor-pointer"
                                        onClick={() => hook.setPreviewFile({ url: art.proofFilePath as string, name: (art.proofFileName as string) || "Vendor Proof" })}>
                                        {(() => {
                                          const pPath = art.proofFilePath as string;
                                          const pExt = pPath.split("?")[0].split(".").pop()?.toLowerCase();
                                          const pIsDesign = ["ai", "eps", "psd"].includes(pExt || "");
                                          const pSrc = pIsDesign && pPath.includes("cloudinary.com")
                                            ? getCloudinaryThumbnail(pPath, 80, 80) : pPath;
                                          return <img src={pSrc} alt="Proof" className="w-full h-full object-contain p-0.5"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
                                        })()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-blue-700">Vendor Proof</p>
                                        <p className="text-[10px] text-blue-500 truncate">{(art.proofFileName as string) || "proof-file"}</p>
                                      </div>
                                      <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-800"
                                        onClick={() => hook.setPreviewFile({ url: art.proofFilePath as string, name: (art.proofFileName as string) || "Vendor Proof" })}>
                                        <Eye className="w-3 h-3 mr-1" /> View
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 px-3 pb-3 flex-wrap">
                                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                                    onClick={() => hook.handleOpenArtworkApprovalLink(art)}>
                                    <ExternalLink className="w-3 h-3" /> Open Approval Link
                                  </Button>
                                </div>

                                {proofRequired && !hook.isLocked && (
                                  <div className="flex items-center gap-2 px-3 pb-3 flex-wrap">
                                    {canRequestProof && (
                                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                                        disabled={hook.updateArtworkMutation.isPending}
                                        onClick={() => {
                                          hook.updateArtworkMutation.mutate({
                                            artworkId: art.id, orderItemId: art.orderItemId,
                                            updates: { name: art.name, status: "awaiting_proof" },
                                          });
                                        }}>
                                        {hook.updateArtworkMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />} Request Proof
                                      </Button>
                                    )}

                                    {canUpload && (
                                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                                        onClick={() => hook.setUploadProofArt(art)}>
                                        <Upload className="w-3 h-3" /> Upload Proof
                                      </Button>
                                    )}

                                    {canMarkComplete && (
                                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50"
                                        disabled={hook.updateArtworkMutation.isPending}
                                        onClick={() => {
                                          hook.updateArtworkMutation.mutate({
                                            artworkId: art.id, orderItemId: art.orderItemId,
                                            updates: { name: art.name, status: "proofing_complete" },
                                          });
                                        }}>
                                        {hook.updateArtworkMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Complete
                                      </Button>
                                    )}

                                    {art.status === "change_requested" && art.proofFilePath && (
                                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                                        onClick={() => hook.setUploadProofArt(art)}>
                                        <Upload className="w-3 h-3" /> Re-upload Proof
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Grand totals */}
          <Card className="bg-purple-50/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-5">
                  <div>
                    <span className="text-gray-500 text-xs">Vendors</span>
                    <p className="font-semibold">{hook.vendorPOs.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Total Qty</span>
                    <p className="font-semibold">{hook.grandTotalQty}</p>
                  </div>
                  {hook.order?.supplierInHandsDate && (
                    <div>
                      <span className="text-gray-500 text-xs">Supplier IHD</span>
                      <p className="font-semibold text-blue-700">{new Date(hook.order!.supplierInHandsDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {hook.order?.inHandsDate && (
                    <div>
                      <span className="text-gray-500 text-xs">Customer IHD</span>
                      <p className="font-semibold">{new Date(hook.order!.inHandsDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Total PO Cost</span>
                  <p className="text-lg font-bold text-purple-700">${hook.grandTotalCost.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live PDF preview for vendor POs (uses react-pdf PDFViewer) */}
      <PdfPreviewDialog
        open={!!hook.previewVendorKey}
        onOpenChange={(open) => !open && hook.setPreviewVendorKey(null)}
        title={`PO Preview`}
        document={hook.previewVendorKey ? hook.buildVendorPoDoc(hook.previewVendorKey) : null}
      />

      {/* Email PO to Vendor Dialog */}
      <Dialog open={!!hook.emailPOVendor} onOpenChange={(open) => !open && hook.setEmailPOVendor(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" /> Email PO to Vendor
            </DialogTitle>
            <DialogDescription>
              Send PO #{hook.emailPOVendor?.doc.documentNumber} to {hook.emailPOVendor?.vendor.name}. The PO PDF link will be included.
            </DialogDescription>
          </DialogHeader>
          <EmailComposer
            contacts={hook.poVendorContacts.length > 0 ? hook.poVendorContacts.map((c) => ({
              id: String(c.id),
              firstName: c.firstName || "",
              lastName: c.lastName || "",
              email: c.email,
              isPrimary: c.isPrimary,
              title: c.title,
              receiveOrderEmails: c.receiveOrderEmails,
            } as EmailContact)) : undefined}
            defaults={{
              to: hook.emailPOVendor?.vendor.email || "",
              toName: hook.emailPOVendor?.vendor.contactPerson || hook.emailPOVendor?.vendor.name || "",
              subject: `${hook.order?.isFirm ? "FIRM - " : ""}Purchase Order #${hook.emailPOVendor?.doc.documentNumber} - ${hook.order?.orderNumber || ""}`,
              body: (() => {
                const ihd = (hook.emailPOVendor?.doc?.metadata as Record<string, unknown> | undefined)?.supplierIHD || hook.order?.supplierInHandsDate;
                return `Hi ${hook.emailPOVendor?.vendor.contactPerson || hook.emailPOVendor?.vendor.name || "there"},\n\nPlease find the attached purchase order for your review and confirmation.\n\nOrder #: ${hook.order?.orderNumber || ""}\nPO #: ${hook.emailPOVendor?.doc.documentNumber || ""}\n${ihd ? `In-Hands Date: ${new Date(ihd as string).toLocaleDateString()}` : ""}\n\nPlease confirm receipt and acknowledge this order.\n\nThank you.`;
              })(),
            }}
            templateType="purchase_order"
            templateMergeData={poMergeData}
            showAdvancedFields
            showAttachments
            contextProjectId={String(hook.order?.id || "")}
            footerHint="The PO PDF and artwork files will be automatically attached. You can also attach additional files above."
            onSend={(formData) => {
              if (!hook.emailPOVendor) return;
              hook.sendPOEmailMutation.mutate({ doc: hook.emailPOVendor.doc, formData });
            }}
            isSending={hook.sendPOEmailMutation.isPending}
            sendLabel="Send PO"
            onCancel={() => hook.setEmailPOVendor(null)}
            resetTrigger={hook.emailPOVendor}
          />
        </DialogContent>
      </Dialog>

      {/* Upload Vendor Proof */}
      <FilePickerDialog
        open={!!hook.uploadProofArt}
        onClose={() => hook.setUploadProofArt(null)}
        onSelect={hook.handleProofUploaded}
        multiple={false}
        contextProjectId={hook.projectId}
        title="Upload Vendor Proof"
      />

      {/* Send Batch Proofs to Client Dialog */}
      <Dialog open={hook.sendProofArts.length > 0} onOpenChange={(open) => !open && hook.setSendProofArts([])}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" /> Send Proofs to Client
            </DialogTitle>
            <DialogDescription>
              Send {hook.sendProofArts.length} artwork proof{hook.sendProofArts.length > 1 ? "s" : ""} to your client for approval. One email will be sent with all approval links.
            </DialogDescription>
          </DialogHeader>
          <EmailComposer
            contacts={hook.data.contacts?.length > 0 ? hook.data.contacts.map((c) => ({
              id: String(c.id),
              firstName: c.firstName || "",
              lastName: c.lastName || "",
              email: c.email,
              isPrimary: c.isPrimary,
              title: c.title,
              receiveOrderEmails: c.receiveOrderEmails,
            } as EmailContact)) : undefined}
            defaults={{
              to: hook.data.primaryContact?.email || "",
              toName: hook.data.primaryContact ? `${hook.data.primaryContact.firstName} ${hook.data.primaryContact.lastName}` : hook.data.companyName || "",
              cc: (hook.data as unknown as { assignedUser?: { email?: string } })?.assignedUser?.email || "",
              subject: `Artwork Proofs for Review - ${hook.order?.orderNumber || ""}`,
              body: (() => {
                const pc = hook.data.primaryContact;
                const cn = hook.data.companyName || "";
                const artItems = hook.sendProofArts.map((a) => `<li>${a.productName} (${a.location || a.artworkType || "Artwork"})</li>`).join("");
                return `<p>Hi ${pc?.firstName || "there"},</p><p>We've received artwork proofs for your order. Please review each proof and let us know if you'd like to approve or request changes.</p><p>Proofs included:</p><ul>${artItems}</ul><p>Review and approve here: <span data-merge-tag="artworkApprovalLink">{{artworkApprovalLink}}</span></p><p>Best regards,<br>${cn}</p>`;
              })(),
            }}
            templateType="proof"
            templateMergeData={proofMergeData}
            showAdvancedFields
            beforeBody={
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {hook.sendProofArts.map((art) => {
                  const vName = (() => {
                    const item = hook.orderItems.find((i) => i.id === art.orderItemId);
                    if (!item?.supplierId) return null;
                    const s = hook.suppliers.find((v) => v.id === item.supplierId);
                    return s?.name || null;
                  })();
                  return (
                    <div key={art.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border">
                      <div className="w-10 h-10 flex-shrink-0 bg-white rounded border overflow-hidden">
                        {art.proofFilePath ? (
                          <img src={art.proofFilePath} alt="Proof" className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <Palette className="w-4 h-4 text-gray-300 m-auto mt-2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{art.productName}</p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {vName && <span className="text-blue-600">{vName}</span>}
                          {vName && " · "}{art.location || art.artworkType || "Artwork"} · {art.proofFileName || "proof"}
                        </p>
                      </div>
                      <Badge className={`text-[10px] ${hook.PROOF_STATUSES[art.status]?.color || ""}`}>
                        {hook.PROOF_STATUSES[art.status]?.label || art.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            }
            footerHint="Proof files will be attached to the email."
            onSend={(formData) => {
              hook.sendBatchProofMutation.mutate({ artworks: hook.sendProofArts, formData });
            }}
            isSending={hook.sendBatchProofMutation.isPending}
            sendLabel={`Send ${hook.sendProofArts.length} Proof${hook.sendProofArts.length > 1 ? "s" : ""}`}
            onCancel={() => hook.setSendProofArts([])}
            resetTrigger={hook.sendProofArts.length > 0 ? hook.sendProofArts : null}
          />
        </DialogContent>
      </Dialog>

      {/* PO Preview Dialog */}
      <Dialog open={!!hook.previewPO} onOpenChange={(open) => !open && hook.setPreviewPO(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Purchase Order Preview
            </DialogTitle>
          </DialogHeader>
          {hook.previewPO && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">PURCHASE ORDER</h3>
                    <p className="text-sm text-gray-600">Order: {hook.order?.orderNumber || hook.projectId}</p>
                    <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{hook.previewPO.vendor.name}</p>
                    {(() => {
                      const addr = hook.getVendorDefaultAddress(hook.previewPO.vendor.id);
                      if (!addr) return null;
                      const line = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(", ");
                      return line ? <p className="text-sm text-gray-600">{line}</p> : null;
                    })()}
                    {hook.previewPO.vendor.email && <p className="text-sm text-gray-600">{hook.previewPO.vendor.email}</p>}
                  </div>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold">Product</th>
                      <th className="text-right p-3 font-semibold">Qty</th>
                      <th className="text-right p-3 font-semibold">Cost</th>
                      <th className="text-right p-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hook.previewPO.items.map((item) => {
                      const qty = item.quantity || 0;
                      const cost = parseFloat(item.cost || item.unitPrice || "0");
                      const itemArts = hook.allArtworkItems[item.id] || [];
                      return (
                        <tr key={item.id} className="border-b">
                          <td className="p-3">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.productSku}</p>
                            {itemArts.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {itemArts.map((art) => (
                                  <div key={art.id} className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 rounded px-2 py-1">
                                    {art.filePath && (() => {
                                      const ext = art.filePath.split("?")[0].split(".").pop()?.toLowerCase();
                                      const isDesign = ["ai", "eps", "psd"].includes(ext || "");
                                      const src = isDesign && art.filePath.includes("cloudinary.com")
                                        ? getCloudinaryThumbnail(art.filePath, 48, 48) : art.filePath;
                                      return <img src={src} className="w-6 h-6 rounded object-contain border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
                                    })()}
                                    <span className="font-medium">{art.name}</span>
                                    {art.artworkType && <span>· {art.artworkType}</span>}
                                    {art.location && <span>· {art.location}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right align-top">{qty}</td>
                          <td className="p-3 text-right align-top">${cost.toFixed(2)}</td>
                          <td className="p-3 text-right font-medium align-top">${(qty * cost).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50"><tr><td colSpan={2} className="p-3 font-bold">TOTAL</td><td></td><td className="p-3 text-right font-bold text-blue-700">${hook.previewPO.totalCost.toFixed(2)}</td></tr></tfoot>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => hook.setPreviewPO(null)}>Close</Button>
            <Button variant="outline" onClick={() => { hook.previewPO && hook.copyPOToClipboard(hook.previewPO); }}><Copy className="w-4 h-4 mr-2" /> Copy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notify Vendor Email Dialog (general email, no PO stage change) */}
      <Dialog open={!!hook.notifyVendor} onOpenChange={(open) => !open && hook.setNotifyVendor(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" /> Email Vendor — {hook.notifyVendor?.vendor?.name}
            </DialogTitle>
          </DialogHeader>
          {hook.notifyVendor && (
            <EmailComposer
              defaults={{
                to: hook.notifyVendor.vendor.email || "",
                toName: hook.notifyVendor.vendor.name || "",
                subject: hook.notifyVendor.subject || "",
                body: hook.notifyVendor.body || "",
              }}
              autoFillSender
              onSend={async (formData) => {
                await sendCommunication(projectId, {
                  communicationType: "vendor_email",
                  direction: "sent",
                  recipientEmail: formData.to,
                  recipientName: formData.toName,
                  subject: formData.subject,
                  body: formData.body,
                  cc: formData.cc || undefined,
                  bcc: formData.bcc || undefined,
                  metadata: { type: "vendor_notification", vendorId: hook.notifyVendor?.vendor?.id },
                });
                toast({ title: "Email sent to vendor" });
                hook.setNotifyVendor(null);
              }}
              onCancel={() => hook.setNotifyVendor(null)}
              sendLabel="Send Email"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Document Editor */}
      {hook.previewDocument && (
        <DocumentEditor document={hook.previewDocument} order={hook.order} orderItems={hook.orderItems}
          companyName={hook.data.companyName || ""} primaryContact={hook.data.primaryContact}
          getEditedItem={hook.getEditedItem} onClose={() => hook.setPreviewDocument(null)}
          allArtworkItems={hook.allArtworkItems} />
      )}

      {/* File Preview */}
      {hook.previewFile && (
        <FilePreviewModal open={true}
          file={{
            fileName: hook.previewFile.name, originalName: hook.previewFile.name, filePath: hook.previewFile.url,
            mimeType: hook.previewFile.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? "image/png" : "application/pdf"
          }}
          onClose={() => hook.setPreviewFile(null)} />
      )}
    </div>
  );
}
