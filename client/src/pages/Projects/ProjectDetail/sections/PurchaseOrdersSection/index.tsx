import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle, Building2, Calendar, CheckCircle, ChevronDown, ChevronRight,
  ClipboardList, Copy, Download, ExternalLink, Eye, FileText, Loader2,
  Mail, MoreHorizontal, Package, Palette, Printer, Send, ShieldCheck, Upload,
} from "lucide-react";
import EmailComposer from "@/components/email/EmailComposer";
import type { EmailContact } from "@/components/email/types";
import type { OrderItemLine } from "@shared/schema";
import PurchaseOrderTemplate from "@/components/documents/PurchaseOrderTemplate";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { DocumentEditor } from "@/components/feature/DocumentEditor";
import FilePickerDialog from "@/components/modals/FilePickerDialog";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";
import { EditableDate } from "@/components/shared/InlineEditable";
import type { PurchaseOrdersSectionProps } from "./types";
import { usePurchaseOrdersSection } from "./hooks";

export default function PurchaseOrdersSection({ projectId, data, isLocked }: PurchaseOrdersSectionProps) {
  const h = usePurchaseOrdersSection({ projectId, data, isLocked });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Purchase Orders
          </h2>
          <Badge variant="secondary" className="text-xs">
            {h.vendorPOs.length} vendor{h.vendorPOs.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        {!h.isLocked && h.getAllSendableProofs().length > 0 && (
          <Button variant="default" size="sm" className="gap-1.5" onClick={h.openSendAllVendorProofs}>
            <Send className="w-4 h-4" />
            Send All Proofs to Client ({h.getAllSendableProofs().length})
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
              value={(h.order as any)?.supplierInHandsDate}
              field="supplierInHandsDate"
              onSave={h.updateField}
              emptyText="Click to set date"
              isLocked={h.isLocked}
              isPending={h.isFieldPending}
            />
          </div>
          {(h.order as any)?.inHandsDate && (
            <div className="mt-2 pt-2 border-t border-blue-200 flex items-center gap-4 text-xs text-blue-700">
              <span>Customer In-Hands: <strong>{new Date((h.order as any).inHandsDate).toLocaleDateString()}</strong></span>
              {(h.order as any)?.eventDate && (
                <span>Event Date: <strong>{new Date((h.order as any).eventDate).toLocaleDateString()}</strong></span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier IHD Warning */}
      {!h.hasSupplierIHD && h.orderItems.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Supplier In-Hands Date is required before generating POs. Set the date above.</span>
        </div>
      )}

      {/* Shipping Warnings */}
      {!h.hasShippingAddress && h.orderItems.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>No shipping address set. POs require a ship-to address — set it in the Sales Order section.</span>
        </div>
      )}
      {h.hasShippingAddress && !h.allShippingConfigured && h.orderItems.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Not all products have shipping details configured. Complete shipping details in the Shipping tab before generating POs.</span>
        </div>
      )}

      {/* Empty state */}
      {h.vendorPOs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No vendors on this order</p>
            <p className="text-xs text-gray-400">Add products with vendor/supplier info to generate POs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {h.vendorPOs.map((po) => {
            const isExpanded = h.expandedVendors.has(po.vendor.id);
            const vendorDoc = h.getVendorDoc(po.vendor.id);
            const isVendorGenerating = h.generatingVendorId === po.vendor.id;
            const poStage = vendorDoc ? h.getDocStage(vendorDoc) : null;
            const poStatus = vendorDoc ? h.getDocStatus(vendorDoc) : null;
            const stageInfo = poStage ? h.PO_STAGES[poStage] || h.PO_STAGES.created : null;
            const statusInfo = poStatus ? h.PO_STATUSES[poStatus] || h.PO_STATUSES.ok : null;
            const vendorArtworks = h.getVendorArtworks(po.vendor.id);
            const vendorIhdValue = vendorDoc?.metadata?.supplierIHD;
            const effectiveIhd = vendorIhdValue || (h.order as any)?.supplierInHandsDate;

            return (
              <Card key={po.vendor.id} className="overflow-hidden">
                {/* Vendor header row */}
                <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => h.toggleVendor(po.vendor.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{po.vendor.name}</h3>
                          {stageInfo && <Badge variant="outline" className={`text-[10px] ${stageInfo.color}`}>{stageInfo.label}</Badge>}
                          {statusInfo && poStatus !== "ok" && <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>}
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
                            const addr = h.getVendorDefaultAddress(po.vendor.id);
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
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {!vendorDoc ? (
                          <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                            onClick={() => h.handleGeneratePO(po.vendor.id, po.vendor.name)}
                            disabled={isVendorGenerating || h.isGenerating || h.isLocked || !h.hasSupplierIHD}>
                            {isVendorGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                            Generate PO
                          </Button>
                        ) : (
                          <>
                            {poStage === "created" && (
                              <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                                onClick={() => h.openEmailPO(vendorDoc, po.vendor)} disabled={h.isLocked}>
                                <Mail className="w-3 h-3" /> Email to Vendor
                              </Button>
                            )}
                            {(poStage === "submitted") && vendorDoc && (
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50"
                                onClick={() => h.updateDocMetaMutation.mutate({
                                  docId: vendorDoc.id,
                                  updates: { metadata: { ...vendorDoc.metadata, poStage: "confirmed" } },
                                })}
                                disabled={h.isLocked || h.updateDocMetaMutation.isPending}>
                                {h.updateDocMetaMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
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
                                  <DropdownMenuItem onClick={() => h.openEmailPO(vendorDoc, po.vendor)}>
                                    <Mail className="w-4 h-4 mr-2" /> Resend PO Email
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => h.setPreviewDocument(vendorDoc)}>
                                  <Eye className="w-4 h-4 mr-2" /> Preview PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  if (vendorDoc.fileUrl) {
                                    const link = document.createElement("a");
                                    link.href = vendorDoc.fileUrl; link.download = vendorDoc.fileName;
                                    link.target = "_blank"; document.body.appendChild(link);
                                    link.click(); document.body.removeChild(link);
                                  }
                                }}>
                                  <Download className="w-4 h-4 mr-2" /> Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => h.setPreviewPO(po)}>
                                  <FileText className="w-4 h-4 mr-2" /> Quick Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => h.copyPOToClipboard(po)}>
                                  <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {poStage === "submitted" && (
                                  <DropdownMenuItem onClick={() => h.updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "confirmed" } },
                                  })}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Confirmed
                                  </DropdownMenuItem>
                                )}
                                {poStage === "confirmed" && (
                                  <DropdownMenuItem onClick={() => h.updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "shipped" } },
                                  })}>
                                    <Package className="w-4 h-4 mr-2" /> Mark as Shipped
                                  </DropdownMenuItem>
                                )}
                                {poStage === "shipped" && (
                                  <DropdownMenuItem onClick={() => h.updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "ready_for_billing" } },
                                  })}>
                                    <ClipboardList className="w-4 h-4 mr-2" /> Ready for Billing
                                  </DropdownMenuItem>
                                )}
                                {poStage === "ready_for_billing" && (
                                  <DropdownMenuItem onClick={() => h.updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "billed" } },
                                  })}>
                                    <FileText className="w-4 h-4 mr-2" /> Mark as Billed
                                  </DropdownMenuItem>
                                )}
                                {poStage === "billed" && (
                                  <DropdownMenuItem onClick={() => h.updateDocMetaMutation.mutate({
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
                    {/* Items List */}
                    <div className="bg-gray-50/50">
                      {po.items.map((item: any, idx: number) => {
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
                                      <th className="text-right p-2 font-medium">Ext. Cost</th>
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
                              {vendorArtworks.filter((a: any) => a.proofRequired !== false && ["approved", "proofing_complete"].includes(a.status)).length}/{vendorArtworks.filter((a: any) => a.proofRequired !== false).length} approved
                            </Badge>
                          </h4>
                          {!h.isLocked && vendorArtworks.some((a: any) => a.proofRequired !== false && a.proofFilePath && ["proof_received", "change_requested"].includes(a.status)) && (
                            <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                              onClick={() => h.openSendAllProofs(po.vendor.id)}>
                              <Send className="w-3 h-3" /> Send All Proofs to Client
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {vendorArtworks.map((art: any) => {
                            const proofRequired = art.proofRequired !== false;
                            const si = h.PROOF_STATUSES[art.status] || h.PROOF_STATUSES.pending;
                            const canRequestProof = proofRequired && ["pending", "change_requested"].includes(art.status || "pending");
                            const canUpload = proofRequired && ["pending", "awaiting_proof", "change_requested"].includes(art.status || "pending");
                            const canMarkComplete = proofRequired && art.status === "approved";

                            return (
                              <div key={art.id} className={`rounded-lg border ${proofRequired ? "" : "opacity-50"}`}>
                                <div className="flex items-center gap-3 p-3">
                                  <div className="w-12 h-12 flex-shrink-0 bg-white rounded border overflow-hidden flex items-center justify-center cursor-pointer"
                                    onClick={() => { const url = art.fileUrl || art.filePath; if (url) h.setPreviewFile({ url, name: art.name || "Artwork" }); }}>
                                    {art.fileUrl || art.filePath ? (
                                      <img src={art.fileUrl || art.filePath} alt="" className="w-full h-full object-contain p-0.5" />
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

                                  <div className="flex items-center gap-1.5" title={proofRequired ? "Proof required" : "No proof needed"}>
                                    <ShieldCheck className={`w-3.5 h-3.5 ${proofRequired ? "text-blue-500" : "text-gray-300"}`} />
                                    <Switch
                                      checked={proofRequired}
                                      onCheckedChange={(checked) => {
                                        h.updateArtworkMutation.mutate({
                                          artworkId: art.id, orderItemId: art.orderItemId,
                                          updates: { name: art.name, proofRequired: checked },
                                        });
                                      }}
                                      className="h-4 w-7"
                                      disabled={h.isLocked}
                                    />
                                  </div>

                                  {proofRequired ? (
                                    <Badge className={`text-[10px] ${si.color}`}>{si.label}</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] text-gray-400">No Proof</Badge>
                                  )}
                                </div>

                                {proofRequired && art.proofFilePath && (
                                  <div className="px-3 pb-2">
                                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-md border border-blue-100">
                                      <div className="w-10 h-10 flex-shrink-0 bg-white rounded border overflow-hidden cursor-pointer"
                                        onClick={() => h.setPreviewFile({ url: art.proofFilePath, name: art.proofFileName || "Vendor Proof" })}>
                                        <img src={art.proofFilePath} alt="Proof" className="w-full h-full object-contain p-0.5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-blue-700">Vendor Proof</p>
                                        <p className="text-[10px] text-blue-500 truncate">{art.proofFileName || "proof-file"}</p>
                                      </div>
                                      <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-800"
                                        onClick={() => h.setPreviewFile({ url: art.proofFilePath, name: art.proofFileName || "Vendor Proof" })}>
                                        <Eye className="w-3 h-3 mr-1" /> View
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {proofRequired && !h.isLocked && (
                                  <div className="flex items-center gap-2 px-3 pb-3 flex-wrap">
                                    {canRequestProof && (
                                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                                        onClick={() => {
                                          h.updateArtworkMutation.mutate({
                                            artworkId: art.id, orderItemId: art.orderItemId,
                                            updates: { name: art.name, status: "awaiting_proof" },
                                          });
                                        }}>
                                        <Mail className="w-3 h-3" /> Request Proof
                                      </Button>
                                    )}

                                    {canUpload && (
                                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                                        onClick={() => h.setUploadProofArt(art)}>
                                        <Upload className="w-3 h-3" /> Upload Proof
                                      </Button>
                                    )}

                                    {canMarkComplete && (
                                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50"
                                        onClick={() => {
                                          h.updateArtworkMutation.mutate({
                                            artworkId: art.id, orderItemId: art.orderItemId,
                                            updates: { name: art.name, status: "proofing_complete" },
                                          });
                                        }}>
                                        <CheckCircle className="w-3 h-3" /> Complete
                                      </Button>
                                    )}

                                    {art.status === "change_requested" && art.proofFilePath && (
                                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                                        onClick={() => h.setUploadProofArt(art)}>
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

                    {/* PO Stage selector + Supplier IHD */}
                    {vendorDoc && (
                      <div className="border-t p-4 flex items-center gap-4 flex-wrap">
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-1">PO Stage</label>
                          <Select
                            value={h.getDocStage(vendorDoc)}
                            onValueChange={(val) => h.updateDocMetaMutation.mutate({
                              docId: vendorDoc.id,
                              updates: { metadata: { ...vendorDoc.metadata, poStage: val } },
                            })}
                            disabled={h.isLocked}
                          >
                            <SelectTrigger className="h-8 text-xs w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(h.PO_STAGES).map(([key, val]) => (
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
                            value={h.getDocStatus(vendorDoc)}
                            onValueChange={(val) => h.updateDocMetaMutation.mutate({
                              docId: vendorDoc.id,
                              updates: { metadata: { ...vendorDoc.metadata, poStatus: val } },
                            })}
                            disabled={h.isLocked}
                          >
                            <SelectTrigger className="h-8 text-xs w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(h.PO_STATUSES).map(([key, val]) => (
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
                          <label className="text-[10px] font-medium text-gray-500 block mb-1">
                            Supplier IHD <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="date"
                            value={vendorDoc.metadata?.supplierIHD || ''}
                            onChange={(e) => h.updateDocMetaMutation.mutate({
                              docId: vendorDoc.id,
                              updates: { metadata: { ...vendorDoc.metadata, supplierIHD: e.target.value } },
                            })}
                            className={`h-8 text-xs w-[160px] ${!vendorDoc.metadata?.supplierIHD ? 'border-red-300' : ''}`}
                            disabled={h.isLocked}
                          />
                        </div>
                        {(h.order as any)?.inHandsDate && (
                          <div className="text-[10px] text-gray-500 ml-auto">
                            Customer IHD: <strong>{new Date((h.order as any).inHandsDate).toLocaleDateString()}</strong>
                          </div>
                        )}
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
                    <p className="font-semibold">{h.vendorPOs.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Total Qty</span>
                    <p className="font-semibold">{h.grandTotalQty}</p>
                  </div>
                  {(h.order as any)?.supplierInHandsDate && (
                    <div>
                      <span className="text-gray-500 text-xs">Supplier IHD</span>
                      <p className="font-semibold text-blue-700">{new Date((h.order as any).supplierInHandsDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {(h.order as any)?.inHandsDate && (
                    <div>
                      <span className="text-gray-500 text-xs">Customer IHD</span>
                      <p className="font-semibold">{new Date((h.order as any).inHandsDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Total PO Cost</span>
                  <p className="text-lg font-bold text-purple-700">${h.grandTotalCost.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden PO templates for PDF generation */}
      {h.vendorPOs.map((po) => {
        const poNumber = `${(h.order as any)?.orderNumber || h.projectId}-${po.vendor.id.substring(0, 4).toUpperCase()}`;
        return (
          <PurchaseOrderTemplate
            key={po.vendor.id}
            ref={(el) => { h.poRefs.current[po.vendor.id] = el; }}
            order={h.order}
            vendor={po.vendor}
            vendorItems={po.items}
            poNumber={poNumber}
            artworkItems={h.getVendorArtworks(po.vendor.id)}
            vendorIHD={h.getVendorDoc(po.vendor.id)?.metadata?.supplierIHD || null}
            vendorAddress={h.getVendorDefaultAddress(po.vendor.id)}
          />
        );
      })}

      {/* Email PO to Vendor Dialog */}
      <Dialog open={!!h.emailPOVendor} onOpenChange={(open) => !open && h.setEmailPOVendor(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" /> Email PO to Vendor
            </DialogTitle>
            <DialogDescription>
              Send PO #{h.emailPOVendor?.doc.documentNumber} to {h.emailPOVendor?.vendor.name}. The PO PDF link will be included.
            </DialogDescription>
          </DialogHeader>
          <EmailComposer
            contacts={h.poVendorContacts.length > 0 ? h.poVendorContacts.map((c: any) => ({
              id: String(c.id),
              firstName: c.firstName || "",
              lastName: c.lastName || "",
              email: c.email,
              isPrimary: c.isPrimary,
              title: c.title,
              receiveOrderEmails: c.receiveOrderEmails,
            } as EmailContact)) : undefined}
            defaults={{
              to: h.emailPOVendor?.vendor.email || "",
              toName: h.emailPOVendor?.vendor.contactPerson || h.emailPOVendor?.vendor.name || "",
              subject: `Purchase Order #${h.emailPOVendor?.doc.documentNumber} - ${(h.order as any)?.orderNumber || ""}`,
              body: (() => {
                const ihd = h.emailPOVendor?.doc?.metadata?.supplierIHD || (h.order as any)?.supplierInHandsDate;
                return `Hi ${h.emailPOVendor?.vendor.contactPerson || h.emailPOVendor?.vendor.name || "there"},\n\nPlease find the attached purchase order for your review and confirmation.\n\nOrder #: ${(h.order as any)?.orderNumber || ""}\nPO #: ${h.emailPOVendor?.doc.documentNumber || ""}\n${ihd ? `In-Hands Date: ${new Date(ihd).toLocaleDateString()}` : ""}\n\nPlease confirm receipt and acknowledge this order.\n\nThank you.`;
              })(),
            }}
            showAdvancedFields
            footerHint="The PO PDF and artwork files will be automatically attached."
            onSend={(formData) => {
              if (!h.emailPOVendor) return;
              h.sendPOEmailMutation.mutate({ doc: h.emailPOVendor.doc, formData });
            }}
            isSending={h.sendPOEmailMutation.isPending}
            sendLabel="Send PO"
            onCancel={() => h.setEmailPOVendor(null)}
            resetTrigger={h.emailPOVendor}
          />
        </DialogContent>
      </Dialog>

      {/* Upload Vendor Proof */}
      <FilePickerDialog
        open={!!h.uploadProofArt}
        onClose={() => h.setUploadProofArt(null)}
        onSelect={h.handleProofUploaded}
        multiple={false}
        contextProjectId={h.projectId}
        title="Upload Vendor Proof"
      />

      {/* Send Batch Proofs to Client Dialog */}
      <Dialog open={h.sendProofArts.length > 0} onOpenChange={(open) => !open && h.setSendProofArts([])}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" /> Send Proofs to Client
            </DialogTitle>
            <DialogDescription>
              Send {h.sendProofArts.length} artwork proof{h.sendProofArts.length > 1 ? "s" : ""} to your client for approval. One email will be sent with all approval links.
            </DialogDescription>
          </DialogHeader>
          <EmailComposer
            contacts={h.data.contacts?.length > 0 ? h.data.contacts.map((c: any) => ({
              id: String(c.id),
              firstName: c.firstName || "",
              lastName: c.lastName || "",
              email: c.email,
              isPrimary: c.isPrimary,
              title: c.title,
              receiveOrderEmails: c.receiveOrderEmails,
            } as EmailContact)) : undefined}
            defaults={{
              to: h.data.primaryContact?.email || "",
              toName: h.data.primaryContact ? `${h.data.primaryContact.firstName} ${h.data.primaryContact.lastName}` : h.data.companyName || "",
              body: (() => {
                const pc = h.data.primaryContact;
                const cn = h.data.companyName || "";
                const artList = h.sendProofArts.map((a: any) => `  - ${a.productName} (${a.location || a.artworkType || "Artwork"})`).join("\n");
                return `Hi ${pc?.firstName || "there"},\n\nWe've received artwork proofs for your order. Please review each proof below and let us know if you'd like to approve or request changes.\n\nProofs included:\n${artList}\n\nBest regards,\n${cn}`;
              })(),
            }}
            showAdvancedFields
            beforeBody={
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {h.sendProofArts.map((art: any) => {
                  const vName = (() => {
                    const item = h.orderItems.find((i: any) => i.id === art.orderItemId);
                    if (!item?.supplierId) return null;
                    const s = h.suppliers.find((v: any) => v.id === item.supplierId);
                    return s?.name || s?.companyName || null;
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
                      <Badge className={`text-[10px] ${h.PROOF_STATUSES[art.status]?.color || ""}`}>
                        {h.PROOF_STATUSES[art.status]?.label || art.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            }
            footerHint={`${h.sendProofArts.length} approval link${h.sendProofArts.length > 1 ? "s" : ""} will be automatically included in the email.`}
            onSend={(formData) => {
              h.sendBatchProofMutation.mutate({ artworks: h.sendProofArts, formData });
            }}
            isSending={h.sendBatchProofMutation.isPending}
            sendLabel={`Send ${h.sendProofArts.length} Proof${h.sendProofArts.length > 1 ? "s" : ""}`}
            onCancel={() => h.setSendProofArts([])}
            resetTrigger={h.sendProofArts.length > 0 ? h.sendProofArts : null}
          />
        </DialogContent>
      </Dialog>

      {/* PO Preview Dialog */}
      <Dialog open={!!h.previewPO} onOpenChange={(open) => !open && h.setPreviewPO(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Purchase Order Preview
            </DialogTitle>
          </DialogHeader>
          {h.previewPO && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">PURCHASE ORDER</h3>
                    <p className="text-sm text-gray-600">Order: {(h.order as any)?.orderNumber || h.projectId}</p>
                    <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{h.previewPO.vendor.name}</p>
                    {(() => {
                      const addr = h.getVendorDefaultAddress(h.previewPO.vendor.id);
                      if (!addr) return null;
                      const line = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(", ");
                      return line ? <p className="text-sm text-gray-600">{line}</p> : null;
                    })()}
                    {h.previewPO.vendor.email && <p className="text-sm text-gray-600">{h.previewPO.vendor.email}</p>}
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
                    {h.previewPO.items.map((item: any) => {
                      const qty = item.quantity || 0;
                      const cost = parseFloat(item.cost || item.unitPrice || "0");
                      return (
                        <tr key={item.id} className="border-b">
                          <td className="p-3"><p className="font-medium">{item.productName}</p><p className="text-xs text-gray-500">{item.productSku}</p></td>
                          <td className="p-3 text-right">{qty}</td>
                          <td className="p-3 text-right">${cost.toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">${(qty * cost).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50"><tr><td colSpan={2} className="p-3 font-bold">TOTAL</td><td></td><td className="p-3 text-right font-bold text-blue-700">${h.previewPO.totalCost.toFixed(2)}</td></tr></tfoot>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => h.setPreviewPO(null)}>Close</Button>
            <Button variant="outline" onClick={() => { h.previewPO && h.copyPOToClipboard(h.previewPO); }}><Copy className="w-4 h-4 mr-2" /> Copy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Editor */}
      {h.previewDocument && (
        <DocumentEditor document={h.previewDocument} order={h.order} orderItems={h.orderItems}
          companyName={(h.data as any).companyName || ""} primaryContact={(h.data as any).primaryContact}
          getEditedItem={h.getEditedItem} onClose={() => h.setPreviewDocument(null)}
          allArtworkItems={h.allArtworkItems} />
      )}

      {/* File Preview */}
      {h.previewFile && (
        <FilePreviewModal open={true}
          file={{ fileName: h.previewFile.name, originalName: h.previewFile.name, filePath: h.previewFile.url,
            mimeType: h.previewFile.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? "image/png" : "application/pdf" }}
          onClose={() => h.setPreviewFile(null)} />
      )}
    </div>
  );
}
