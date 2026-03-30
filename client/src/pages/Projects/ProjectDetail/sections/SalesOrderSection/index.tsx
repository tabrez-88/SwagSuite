import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { EditableText, EditableDate, EditableSelect, EditableTextarea } from "@/components/shared/InlineEditable";
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

export default function SalesOrderSection(props: SalesOrderSectionProps) {
  const { projectId, lockStatus } = props;
  const hook = useSalesOrderSection(props);

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
          {/* Order Details Card */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Introduction / Notes */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Introduction</p>
                <EditableTextarea
                  value={hook.order.notes || ""}
                  field="notes"
                  onSave={hook.updateField}
                  placeholder="Order introduction / notes..."
                  emptyText="No introduction"
                  rows={2}
                  isLocked={hook.isLocked}
                  isPending={hook.isFieldPending}
                />
              </div>

              {/* Terms, Dates, Firm */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payment Terms</span>
                  <EditableSelect
                    value={(hook.order as any)?.paymentTerms || "net_30"}
                    field="paymentTerms"
                    onSave={hook.updateField}
                    options={[
                      { value: "net_30", label: "Net 30" },
                      { value: "net_15", label: "Net 15" },
                      { value: "net_60", label: "Net 60" },
                      { value: "credit_card", label: "Credit Card" },
                      { value: "due_on_receipt", label: "Due on Receipt" },
                      { value: "prepaid", label: "Prepaid" },
                    ]}
                    isLocked={hook.isLocked}
                    isPending={hook.isFieldPending}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Customer PO</span>
                  <EditableText
                    value={(hook.order as any)?.customerPo || ""}
                    field="customerPo"
                    onSave={hook.updateField}
                    placeholder="PO #"
                    emptyText="Not set"
                    isLocked={hook.isLocked}
                    isPending={hook.isFieldPending}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Default Margin</span>
                  <EditableText
                    value={String((hook.order as any)?.margin || "")}
                    field="margin"
                    onSave={hook.updateField}
                    type="number"
                    suffix="%"
                    placeholder="0"
                    emptyText="Not set"
                    isLocked={hook.isLocked}
                    isPending={hook.isFieldPending}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Discount</span>
                  <EditableText
                    value={(hook.order as any)?.orderDiscount || ""}
                    field="orderDiscount"
                    onSave={hook.updateField}
                    type="number"
                    suffix="%"
                    placeholder="0"
                    emptyText="None"
                    isLocked={hook.isLocked}
                    isPending={hook.isFieldPending}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">In-Hands Date</span>
                  <EditableDate
                    value={hook.order.inHandsDate}
                    field="inHandsDate"
                    onSave={hook.updateField}
                    isLocked={hook.isLocked}
                    isPending={hook.isFieldPending}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Event Date</span>
                  <EditableDate
                    value={hook.order.eventDate}
                    field="eventDate"
                    onSave={hook.updateField}
                    isLocked={hook.isLocked}
                    isPending={hook.isFieldPending}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Supplier In-Hands</span>
                  <EditableDate
                    value={(hook.order as any)?.supplierInHandsDate}
                    field="supplierInHandsDate"
                    onSave={hook.updateField}
                    isLocked={hook.isLocked}
                    isPending={hook.isFieldPending}
                  />
                </div>
              </div>

              {/* Firm / Rush toggles */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isFirmSO"
                    checked={(hook.order as any)?.isFirm || false}
                    onCheckedChange={(checked) => hook.updateField({ isFirm: !!checked })}
                    disabled={hook.isLocked}
                  />
                  <Label htmlFor="isFirmSO" className="text-sm font-normal cursor-pointer">Firm Order</Label>
                </div>
                {(hook.order as any)?.isRush && (
                  <Badge variant="destructive" className="text-xs">Rush Order</Badge>
                )}
              </div>

              {/* Supplier Notes & Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Supplier Notes</p>
                  <EditableTextarea
                    value={(hook.order as any)?.supplierNotes || ""}
                    field="supplierNotes"
                    onSave={hook.updateField}
                    placeholder="Notes visible to suppliers on POs..."
                    emptyText="No supplier notes"
                    rows={2}
                    isLocked={hook.isLocked}
                    isPending={hook.isFieldPending}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Additional Information</p>
                  <EditableTextarea
                    value={(hook.order as any)?.additionalInformation || ""}
                    field="additionalInformation"
                    onSave={hook.updateField}
                    placeholder="Other relevant details..."
                    emptyText="No additional info"
                    rows={2}
                    isLocked={hook.isLocked}
                    isPending={hook.isFieldPending}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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

      {/* Products / Artwork Tabs */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products" className="gap-1">
            <Package className="w-4 h-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="artwork" className="gap-1">
            <Palette className="w-4 h-4" />
            Artwork
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <ProductsSection projectId={projectId} data={hook.data} isLocked={hook.isLocked} />
        </TabsContent>

        <TabsContent value="artwork" className="mt-4">
          <SalesOrderArtwork hook={hook} />
        </TabsContent>
      </Tabs>

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
