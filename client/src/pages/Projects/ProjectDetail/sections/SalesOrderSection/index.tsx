import React, { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Copy,
  CreditCard,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Package,
  Palette,
  Pencil,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import EditableAddress from "@/components/shared/EditableAddress";
import ProjectInfoBar from "@/components/layout/ProjectInfoBar";
import TimelineWarningBanner from "@/components/shared/TimelineWarningBanner";
import LockBanner from "@/components/shared/LockBanner";
import SalesOrderTemplate from "@/components/documents/SalesOrderTemplate";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { DocumentEditor } from "@/components/feature/DocumentEditor";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";
import { getCloudinaryThumbnail } from "@/lib/media-library";
import SendSODialog from "@/components/modals/SendSODialog";
import ProductsSection from "@/components/sections/ProductsSection";
import type { SalesOrderSectionProps } from "./types";
import { useSalesOrderSection } from "./hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePaymentTerms } from "@/services/payment-terms";

export default function SalesOrderSection(props: SalesOrderSectionProps) {
  const { projectId, lockStatus } = props;
  const hook = useSalesOrderSection(props);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: paymentTermsOptions = [] } = usePaymentTerms();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: taxCodes } = useQuery<any[]>({
    queryKey: ["/api/tax-codes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: branding } = useQuery<any>({
    queryKey: ["/api/settings/branding"],
    queryFn: getQueryFn({ on401: "throw" }),
    staleTime: Infinity,
  });

  const calculateTaxMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/calculate-tax`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({ title: "Tax Calculated", description: "Tax has been updated based on TaxJar rates." });
    },
    onError: (error: Error) => {
      toast({ title: "Tax Calculation Failed", description: error.message, variant: "destructive" });
    },
  });

  if (!hook.order) return null;

  return (
    <div className="space-y-6">
      {lockStatus && <LockBanner lockStatus={lockStatus} sectionName="Sales Order" sectionKey="salesOrder" projectId={projectId} />}
      <TimelineWarningBanner conflicts={hook.timelineConflicts} />

      <ProjectInfoBar companyName={hook.companyName} primaryContact={hook.primaryContact} />

      {/* Sales Order Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Status */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <Select value={hook.currentStatus} onValueChange={(val) => hook.updateStatusMutation.mutate(val)} disabled={hook.isLocked}>
              <SelectTrigger className="w-[220px] h-9">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${hook.statusInfo.color.split(" ")[0]}`} />
                    {hook.statusInfo.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {hook.salesOrderStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${s.color.split(" ")[0]}`} />
                      {s.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sales Order Date (read-only) */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Sales Order Date</label>
            <span className="text-sm font-medium">{hook.order.createdAt ? format(new Date(hook.order.createdAt), "MMM d, yyyy") : "—"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={hook.handleDuplicate}
            disabled={hook.isDuplicating}
            className="gap-1.5"
          >
            {hook.isDuplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Duplicate Order
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => hook.setIsInfoCollapsed(!hook.isInfoCollapsed)}
          >
            {hook.isInfoCollapsed ? (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand Info
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Collapse Info
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Order Info Section */}
      {!hook.isInfoCollapsed && (
        <>
          {/* Order Details Card — read-only display */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Order Details
                </CardTitle>
                {!hook.isLocked && (
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setShowEditDialog(true)}>
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Introduction / Notes */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Introduction</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{hook.order.notes || <span className="text-gray-400 italic">No introduction</span>}</p>
              </div>

              {/* Terms, Dates, Firm */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payment Terms</span>
                  <span className="text-sm font-medium">{(hook.order as any)?.paymentTerms || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Customer PO</span>
                  <span className="text-sm font-medium">{(hook.order as any)?.customerPo || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Default Margin</span>
                  <span className="text-sm font-medium">{(hook.order as any)?.margin ? `${(hook.order as any).margin}%` : "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Discount</span>
                  <span className="text-sm font-medium">{(hook.order as any)?.orderDiscount ? `${(hook.order as any).orderDiscount}%` : "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tax Code</span>
                  <span className="text-sm font-medium">
                    {taxCodes?.find((tc: any) => String(tc.id) === (hook.order as any)?.defaultTaxCodeId)?.label || "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tax</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const taxAmount = Number((hook.order as any)?.tax || 0);
                      const activeTaxCode = taxCodes?.find((tc: any) => String(tc.id) === (hook.order as any)?.defaultTaxCodeId);
                      return (
                        <>
                          <span className={`text-sm font-medium ${taxAmount > 0 ? "text-amber-700" : ""}`}>
                            ${taxAmount.toFixed(2)}
                          </span>
                          {activeTaxCode && !activeTaxCode.isExempt && taxAmount > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200">
                              {activeTaxCode.rate}%
                            </Badge>
                          )}
                          {activeTaxCode?.isExempt && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-50 text-green-700 border-green-200">
                              Exempt
                            </Badge>
                          )}
                        </>
                      );
                    })()}
                    {!hook.isLocked && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => calculateTaxMutation.mutate()}
                        disabled={calculateTaxMutation.isPending}
                      >
                        {calculateTaxMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Calculator className="h-3 w-3" />
                        )}
                        Calculate Tax
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">In-Hands Date</span>
                  <span className="text-sm font-medium">
                    {hook.order.inHandsDate ? format(new Date(hook.order.inHandsDate), "MMM d, yyyy") : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Event Date</span>
                  <span className="text-sm font-medium">
                    {hook.order.eventDate ? format(new Date(hook.order.eventDate), "MMM d, yyyy") : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Supplier In-Hands</span>
                  <span className="text-sm font-medium">
                    {(hook.order as any)?.supplierInHandsDate ? format(new Date((hook.order as any).supplierInHandsDate), "MMM d, yyyy") : "—"}
                  </span>
                </div>
              </div>

              {/* Firm / Rush badges */}
              <div className="flex items-center gap-3">
                {(hook.order as any)?.isFirm && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Firm Order</Badge>
                )}
                {(hook.order as any)?.isRush && (
                  <Badge variant="destructive" className="text-xs">Rush Order</Badge>
                )}
              </div>

              {/* Supplier Notes & Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Supplier Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{(hook.order as any)?.supplierNotes || <span className="text-gray-400 italic">No supplier notes</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Additional Information</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{(hook.order as any)?.additionalInformation || <span className="text-gray-400 italic">No additional info</span>}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SO Details Edit Dialog */}
          <SOEditDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            order={hook.order}
            updateField={hook.updateField}
            isFieldPending={hook.isFieldPending}
            paymentTermsOptions={paymentTermsOptions}
            taxCodes={taxCodes || []}
          />

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableAddress
              title="Billing Address"
              addressJson={(hook.order as any)?.billingAddress}
              field="billingAddress"
              onSave={hook.updateField}
              isLocked={hook.isLocked}
              isPending={hook.isFieldPending}
              icon={<CreditCard className="w-4 h-4" />}
              companyId={hook.order?.companyId}
              primaryContact={hook.primaryContact}
            />
            <EditableAddress
              title="Shipping Address"
              addressJson={(hook.order as any)?.shippingAddress}
              field="shippingAddress"
              onSave={hook.updateField}
              isLocked={hook.isLocked}
              isPending={hook.isFieldPending}
              icon={<MapPin className="w-4 h-4" />}
              companyId={hook.order?.companyId}
              primaryContact={hook.primaryContact}
              billingAddressJson={(hook.order as any)?.billingAddress}
            />
          </div>
        </>
      )}

      {/* Sales Order Document Section */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Sales Order Document
            </CardTitle>
            <div className="flex items-center gap-2">
              {hook.soDocuments.length > 0 && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => hook.setShowSendDialog(true)}
                  disabled={hook.isLocked}
                  className="gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Send to Client
                </Button>
              )}
              {hook.soDocuments.length === 0 && hook.orderItems.length > 0 && (
                <Button
                  size="sm"
                  onClick={hook.handleGenerateSO}
                  disabled={hook.isGenerating || hook.isLocked}
                  className="gap-1.5"
                >
                  {hook.isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Generate Sales Order PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hook.soDocuments.length === 0 ? (
            <div className="text-center py-4">
              <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No sales order document generated yet</p>
              {hook.orderItems.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">Click "Generate Sales Order PDF" to create a professional document</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {hook.soDocuments.map((doc: any) => (
                <GeneratedDocumentCard
                  key={doc.id}
                  document={doc}
                  isStale={hook.isSOStale(doc)}
                  onPreview={() => hook.setPreviewDocument(doc)}
                  onDelete={() => hook.deleteDocument(doc.id)}
                  onRegenerate={hook.isLocked ? undefined : () => hook.handleRegenerateSO(doc.id)}
                  onGetApprovalLink={hook.isLocked ? undefined : () => hook.handleGetApprovalLink(doc)}
                  isDeleting={hook.isDeleting || hook.isLocked}
                  isRegenerating={hook.isGenerating}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      <ProductsSection projectId={projectId} data={hook.data} isLocked={hook.isLocked} />


      {/* Hidden SO template for PDF generation */}
      <SalesOrderTemplate
        ref={hook.soRef}
        order={hook.order}
        orderItems={hook.orderItems}
        companyName={hook.companyName}
        primaryContact={hook.primaryContact}
        allArtworkItems={hook.allArtworkItems}
        allItemCharges={hook.data.allItemCharges}
        allArtworkCharges={hook.data.allArtworkCharges}
        serviceCharges={hook.data.serviceCharges}
        assignedUser={hook.data.assignedUser}
        sellerName={branding?.companyName}
      />

      {/* Document Editor Modal */}
      {hook.previewDocument && (
        <DocumentEditor
          document={hook.previewDocument}
          order={hook.order}
          orderItems={hook.orderItems}
          companyName={hook.companyName}
          primaryContact={hook.primaryContact}
          getEditedItem={hook.getEditedItem}
          onClose={() => hook.setPreviewDocument(null)}
          allArtworkItems={hook.allArtworkItems}
        />
      )}

      {/* Send SO to Client Dialog */}
      {hook.showSendDialog && hook.soDocuments.length > 0 && (
        <SendSODialog
          open={hook.showSendDialog}
          onOpenChange={hook.setShowSendDialog}
          projectId={projectId}
          recipientEmail={hook.primaryContact?.email || ""}
          recipientName={hook.primaryContact ? `${hook.primaryContact.firstName} ${hook.primaryContact.lastName}` : hook.companyName}
          companyName={hook.companyName}
          orderNumber={(hook.order as any)?.orderNumber || ""}
          soDocument={hook.soDocuments[0]}
          soTotal={hook.soTotal}
          quoteApprovals={hook.quoteApprovals}
          createQuoteApproval={hook.createQuoteApproval}
          contacts={hook.contactsList}
        />
      )}

      {/* Duplicate Order Confirmation */}
      <AlertDialog open={hook.showDuplicateConfirm} onOpenChange={hook.setShowDuplicateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5" />
              Duplicate Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              A new project will be created with all items, line items, charges, artwork, and settings copied from this order. The new project will start as a fresh draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={hook.confirmDuplicate} disabled={hook.isDuplicating}>
              {hook.isDuplicating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
              Duplicate
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Artwork Sub-component (view-only, proofing is in PO section) ─────────────
function SalesOrderArtwork({ hook }: { hook: ReturnType<typeof useSalesOrderSection> }) {
  const { artworks, artworkStatusCounts, previewFile, setPreviewFile, proofStatuses } = hook;

  if (artworks.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Palette className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No artwork files</h3>
          <p className="text-gray-500">Add artwork to products in the Products tab</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Summary Bar */}
      {Object.keys(artworkStatusCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(artworkStatusCounts).map(([status, count]) => {
            const info = proofStatuses[status] || proofStatuses.pending;
            return (
              <Badge key={status} variant="outline" className={`text-xs ${info.color}`}>
                {info.label}: {count}
              </Badge>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-500">Proofing workflow is managed in the Purchase Orders section after PO generation.</p>

      {/* Artwork Cards */}
      <div className="space-y-3">
        {artworks.map((art: any) => {
          const statusInfo = proofStatuses[art.status] || proofStatuses.pending;
          return (
            <Card key={art.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex gap-4">
                  {/* Artwork Thumbnail */}
                  <div
                    className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer border"
                    onClick={() => {
                      const url = art.fileUrl || art.filePath;
                      if (url) setPreviewFile({ url, name: art.fileName || art.name || "Artwork" });
                    }}
                  >
                    {art.fileUrl || art.filePath ? (
                      (() => {
                        const url = art.fileUrl || art.filePath;
                        const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
                        const isDesignFile = ["ai", "eps", "psd"].includes(ext || "");
                        const imgSrc = isDesignFile && url.includes("cloudinary.com")
                          ? getCloudinaryThumbnail(url, 160, 160)
                          : url;
                        return (
                          <img
                            src={imgSrc}
                            alt={art.name || "Artwork"}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.parentElement?.insertAdjacentHTML(
                                "afterbegin",
                                `<div class="w-full h-full flex items-center justify-center"><span class="text-[10px] text-gray-400 uppercase font-medium">.${ext || "file"}</span></div>`
                              );
                            }}
                          />
                        );
                      })()
                    ) : (
                      <Palette className="w-8 h-8 text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{art.name || art.fileName || "Artwork"}</p>
                    <p className="text-xs text-gray-500">{art.productName} {art.productSku ? `(${art.productSku})` : ""}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {art.location && <span className="text-xs text-gray-400">{art.location}</span>}
                      {art.artworkType && <span className="text-xs text-gray-400">· {art.artworkType}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                        {statusInfo.label}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {art.decoratorType === "third_party" && art.decoratorName
                          ? `Decorator: ${art.decoratorName}`
                          : `Vendor: ${art.supplierName}`}
                      </span>
                    </div>
                  </div>

                  {/* View buttons */}
                  <div className="flex flex-col gap-1">
                    {(art.fileUrl || art.filePath) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => setPreviewFile({ url: art.fileUrl || art.filePath, name: art.name || "Artwork" })}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                    )}
                    {art.proofFilePath && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs text-blue-600"
                        onClick={() => setPreviewFile({ url: art.proofFilePath, name: art.proofFileName || "Vendor Proof" })}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Proof
                      </Button>
                    )}
                  </div>
                </div>

                {/* Proof File Preview (if exists) */}
                {art.proofFilePath && (
                  <div className="mt-3 flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div
                      className="w-12 h-12 flex-shrink-0 bg-white rounded border overflow-hidden flex items-center justify-center cursor-pointer"
                      onClick={() => setPreviewFile({ url: art.proofFilePath, name: art.proofFileName || "Vendor Proof" })}
                    >
                      {(() => {
                        const pExt = art.proofFilePath.split("?")[0].split(".").pop()?.toLowerCase();
                        const pIsDesign = ["ai", "eps", "psd"].includes(pExt || "");
                        const pSrc = pIsDesign && art.proofFilePath.includes("cloudinary.com")
                          ? getCloudinaryThumbnail(art.proofFilePath, 96, 96)
                          : art.proofFilePath;
                        return <img src={pSrc} alt="Proof" className="w-full h-full object-contain p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-800">Vendor Proof</p>
                      <p className="text-xs text-blue-600 truncate">{art.proofFileName || "proof-file"}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          open={true}
          file={{
            fileName: previewFile.name,
            originalName: previewFile.name,
            filePath: previewFile.url,
            mimeType: previewFile.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? "image/png" : "application/pdf",
          }}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

// ── SO Details Edit Dialog ────────────────────────────────────────
function SOEditDialog({
  open,
  onOpenChange,
  order,
  updateField,
  isFieldPending,
  paymentTermsOptions,
  taxCodes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  updateField: (fields: Record<string, any>, options?: any) => void;
  isFieldPending: boolean;
  paymentTermsOptions: any[];
  taxCodes: any[];
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, any>>({});

  // Populate form when dialog opens
  React.useEffect(() => {
    if (open) {
      setForm({
        notes: order?.notes || "",
        paymentTerms: order?.paymentTerms || "",
        customerPo: order?.customerPo || "",
        margin: order?.margin || "",
        orderDiscount: order?.orderDiscount || "",
        defaultTaxCodeId: order?.defaultTaxCodeId || "none",
        inHandsDate: order?.inHandsDate ? new Date(order.inHandsDate).toISOString().split("T")[0] : "",
        eventDate: order?.eventDate ? new Date(order.eventDate).toISOString().split("T")[0] : "",
        supplierInHandsDate: order?.supplierInHandsDate ? new Date(order.supplierInHandsDate).toISOString().split("T")[0] : "",
        isFirm: order?.isFirm || false,
        supplierNotes: order?.supplierNotes || "",
        additionalInformation: order?.additionalInformation || "",
      });
    }
  }, [open]);

  const handleSave = () => {
    const payload: Record<string, any> = { ...form };
    if (payload.defaultTaxCodeId === "none") payload.defaultTaxCodeId = null;
    if (!payload.inHandsDate) payload.inHandsDate = null;
    if (!payload.eventDate) payload.eventDate = null;
    if (!payload.supplierInHandsDate) payload.supplierInHandsDate = null;
    updateField(payload, {
      onSuccess: () => {
        toast({ title: "Order details updated" });
        onOpenChange(false);
      },
      onError: (error: Error) => {
        toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-gray-500">Introduction / Notes</Label>
            <Textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Order introduction / notes..."
              className="mt-1 min-h-[60px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Payment Terms</Label>
              <Select value={form.paymentTerms || ""} onValueChange={(val) => setForm({ ...form, paymentTerms: val })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select terms" /></SelectTrigger>
                <SelectContent>
                  {paymentTermsOptions.map((t: any) => (
                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Customer PO</Label>
              <Input
                value={form.customerPo || ""}
                onChange={(e) => setForm({ ...form, customerPo: e.target.value })}
                placeholder="PO #"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Default Margin (%)</Label>
              <Input
                type="number"
                value={form.margin || ""}
                onChange={(e) => setForm({ ...form, margin: e.target.value })}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Discount (%)</Label>
              <Input
                type="number"
                value={form.orderDiscount || ""}
                onChange={(e) => setForm({ ...form, orderDiscount: e.target.value })}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Tax Code</Label>
              <Select value={form.defaultTaxCodeId || "none"} onValueChange={(val) => setForm({ ...form, defaultTaxCodeId: val })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tax code" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {taxCodes.map((tc: any) => (
                    <SelectItem key={tc.id} value={String(tc.id)}>
                      {tc.label} {tc.rate ? `(${tc.rate}%)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">In-Hands Date</Label>
              <Input
                type="date"
                value={form.inHandsDate || ""}
                onChange={(e) => setForm({ ...form, inHandsDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Event Date</Label>
              <Input
                type="date"
                value={form.eventDate || ""}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Supplier In-Hands Date</Label>
              <Input
                type="date"
                value={form.supplierInHandsDate || ""}
                onChange={(e) => setForm({ ...form, supplierInHandsDate: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isFirmEdit"
              checked={form.isFirm || false}
              onCheckedChange={(checked) => setForm({ ...form, isFirm: !!checked })}
            />
            <Label htmlFor="isFirmEdit" className="text-sm font-normal cursor-pointer">Firm Order</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Supplier Notes</Label>
              <Textarea
                value={form.supplierNotes || ""}
                onChange={(e) => setForm({ ...form, supplierNotes: e.target.value })}
                placeholder="Notes visible to suppliers on POs..."
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Additional Information</Label>
              <Textarea
                value={form.additionalInformation || ""}
                onChange={(e) => setForm({ ...form, additionalInformation: e.target.value })}
                placeholder="Other relevant details..."
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isFieldPending}>
            {isFieldPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
