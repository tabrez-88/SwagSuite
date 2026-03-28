import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditableText, EditableDate, EditableTextarea } from "@/components/shared/InlineEditable";
import EditableAddress from "@/components/shared/EditableAddress";
import ProjectInfoBar from "@/components/layout/ProjectInfoBar";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  ClipboardList,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Send,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import LockBanner from "@/components/shared/LockBanner";
import StageConversionDialog from "../../components/StageConversionDialog";
import QuoteTemplate from "@/components/documents/QuoteTemplate";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { DocumentEditor } from "@/components/feature/DocumentEditor";
import SendQuoteDialog from "@/components/modals/SendQuoteDialog";
import ProductsSection from "@/components/sections/ProductsSection";
import { Separator } from "@/components/ui/separator";

import { useQuoteSection } from "./hooks";
import { quoteStatuses, getEditedItem } from "./types";
import type { QuoteSectionProps } from "./types";

export default function QuoteSection(props: QuoteSectionProps) {
  const {
    order,
    orderItems,
    quoteApprovals,
    companyName,
    primaryContact,
    allArtworkItems,
    enrichedItems,
    contactsList,
    data,
    currentStatus,
    statusInfo,
    isQuotePhase,
    isLocked,
    quoteDocuments,
    isGenerating,
    isDeleting,
    quoteRef,
    deleteDocument,
    createQuoteApproval,
    updateField,
    isFieldPending,
    updateStatusMutation,
    showConversionDialog,
    setShowConversionDialog,
    previewDocument,
    setPreviewDocument,
    showSendDialog,
    setShowSendDialog,
    handleGenerateQuote,
    handleRegenerateQuote,
    handleGetApprovalLink,
    handleConversionSuccess,
    isQuoteStale,
  } = useQuoteSection(props);

  if (!order) return null;

  return (
    <div className="space-y-6">
      {props.lockStatus && <LockBanner lockStatus={props.lockStatus} sectionName="Quote" sectionKey="quote" projectId={props.projectId} />}

      <ProjectInfoBar companyName={companyName} primaryContact={primaryContact} />

      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
          <Select value={currentStatus} onValueChange={(val) => updateStatusMutation.mutate(val)} disabled={isLocked}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${statusInfo.color.split(" ")[0]}`} />
                  {statusInfo.label}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {quoteStatuses.map((s) => (
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

      </div>

      {/* Quote Details — inline editable fields */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Quote Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Quote Date</span>
              <span className="text-sm font-medium">
                {(order as any)?.createdAt
                  ? format(new Date((order as any).createdAt), "MMM d, yyyy")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">In-Hands Date</span>
              <EditableDate
                value={(order as any)?.inHandsDate}
                field="inHandsDate"
                onSave={updateField}
                isLocked={isLocked}
                isPending={isFieldPending}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Supplier In-Hands</span>
              <EditableDate
                value={(order as any)?.supplierInHandsDate}
                field="supplierInHandsDate"
                onSave={updateField}
                isLocked={isLocked}
                isPending={isFieldPending}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Customer PO</span>
              <EditableText
                value={(order as any)?.customerPo || ""}
                field="customerPo"
                onSave={updateField}
                placeholder="Enter PO #"
                emptyText="Not set"
                isLocked={isLocked}
                isPending={isFieldPending}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment Terms</span>
              <EditableText
                value={(order as any)?.paymentTerms || ""}
                field="paymentTerms"
                onSave={updateField}
                placeholder="e.g. Net 30"
                emptyText="Net 30"
                isLocked={isLocked}
                isPending={isFieldPending}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Currency</span>
              <EditableText
                value={(order as any)?.currency || "USD"}
                field="currency"
                onSave={updateField}
                placeholder="USD"
                emptyText="USD"
                isLocked={isLocked}
                isPending={isFieldPending}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Default Tax</span>
              <EditableText
                value={(order as any)?.taxRate || ""}
                field="taxRate"
                onSave={updateField}
                type="number"
                suffix="%"
                placeholder="0"
                emptyText="0%"
                isLocked={isLocked}
                isPending={isFieldPending}
              />
            </div>
            {/* Discount field hidden — schema retained, feature not yet finalized
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Discount</span>
              <EditableText
                value={(order as any)?.orderDiscount || ""}
                field="orderDiscount"
                onSave={updateField}
                type="number"
                suffix="%"
                placeholder="0"
                emptyText="None"
                isLocked={isLocked}
                isPending={isFieldPending}
              />
            </div>
            */}
            {/* <div className="flex items-center gap-3 col-span-2">
              <Checkbox
                id="isFirm"
                checked={(order as any)?.isFirm || false}
                onCheckedChange={(checked) => updateField({ isFirm: !!checked })}
                disabled={isLocked}
              />
              <Label htmlFor="isFirm" className="text-sm font-normal cursor-pointer">
                Firm In-Hands Date (cannot be adjusted)
              </Label>
            </div> */}
          </div>
          <Separator className="my-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="col-span-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Introduction</p>
              <EditableTextarea
                value={(order as any)?.quoteIntroduction || ""}
                field="quoteIntroduction"
                onSave={updateField}
                placeholder="Introduction message for the quote (visible to client)..."
                emptyText="No introduction"
                rows={3}
                isLocked={isLocked}
                isPending={isFieldPending}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Supplier Notes</p>
              <EditableTextarea
                value={(order as any)?.supplierNotes || ""}
                field="supplierNotes"
                onSave={updateField}
                placeholder="Notes visible to suppliers on POs..."
                emptyText="No supplier notes"
                rows={2}
                isLocked={isLocked}
                isPending={isFieldPending}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Additional Information</p>
              <EditableTextarea
                value={(order as any)?.additionalInformation || ""}
                field="additionalInformation"
                onSave={updateField}
                placeholder="Other relevant details..."
                emptyText="No additional info"
                rows={2}
                isLocked={isLocked}
                isPending={isFieldPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableAddress
          title="Billing Address"
          addressJson={(order as any)?.billingAddress}
          field="billingAddress"
          onSave={updateField}
          isLocked={isLocked}
          isPending={isFieldPending}
          icon={<MapPin className="w-4 h-4" />}
          companyId={order?.companyId}
          primaryContact={primaryContact}
        />
        <EditableAddress
          title="Shipping Address"
          addressJson={(order as any)?.shippingAddress}
          field="shippingAddress"
          onSave={updateField}
          isLocked={isLocked}
          isPending={isFieldPending}
          icon={<MapPin className="w-4 h-4" />}
          companyId={order?.companyId}
          primaryContact={primaryContact}
          billingAddressJson={(order as any)?.billingAddress}
        />
      </div>

      {/* Stage Conversion Banner */}
      {data.businessStage?.stage.id === "quote" && currentStatus === "approved" && (
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200 rounded-lg px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Quote approved!</h3>
            <p className="text-xs text-gray-500 mt-0.5">Convert to a sales order to proceed with fulfillment.</p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowConversionDialog(true)}
          >
            <ArrowRight className="w-4 h-4" />
            Convert to Sales Order
          </Button>
        </div>
      )}

      {/* Quote Products */}
      <ProductsSection projectId={props.projectId} data={data} isLocked={isLocked} />

      {/* Quote Document Section */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Quote Document
            </CardTitle>
            <div className="flex items-center gap-2">
              {quoteDocuments.length > 0 && !isLocked && (
                <Button size="sm" className="gap-1" onClick={() => setShowSendDialog(true)}>
                  <Send className="w-4 h-4" />
                  Send to Client
                </Button>
              )}
              {quoteDocuments.length === 0 && orderItems.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleGenerateQuote}
                  disabled={isGenerating || isLocked}
                  className="gap-1.5"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Generate Quote PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {quoteDocuments.length === 0 ? (
            <div className="text-center py-4">
              <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No quote document generated yet</p>
              {orderItems.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">Click "Generate Quote PDF" to create a professional quote</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {quoteDocuments.map((doc: any) => (
                <GeneratedDocumentCard
                  key={doc.id}
                  document={doc}
                  isStale={isQuoteStale(doc)}
                  onPreview={() => setPreviewDocument(doc)}
                  onDelete={() => deleteDocument(doc.id)}
                  onRegenerate={isLocked ? undefined : () => handleRegenerateQuote(doc.id)}
                  onGetApprovalLink={isLocked ? undefined : () => handleGetApprovalLink(doc)}
                  isDeleting={isDeleting || isLocked}
                  isRegenerating={isGenerating}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      {/* <Card>
        <CardContent className="p-0">
          <div className="flex justify-end">
            <div className="w-full max-w-sm">
              <div className="flex justify-between py-2.5 px-5 text-sm">
                <span className="text-muted-foreground">Subtotal ({totalItems} item, {totalQty.toLocaleString()} qty)</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between py-2.5 px-5 text-sm bg-red-50">
                  <span className="text-red-600">Discount ({discountPercent}%)</span>
                  <span className="font-medium text-red-600">-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              {Number(order.shipping || 0) > 0 && (
                <div className="flex justify-between py-2.5 px-5 text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">${Number(order.shipping).toFixed(2)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between py-2.5 px-5 text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 px-5 border-t-2 border-gray-200 bg-gray-50">
                <span className="text-base font-semibold">Total</span>
                <span className="text-base font-bold text-green-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Quote Approval Status */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approval Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quoteApprovals.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No approval requests sent yet</p>
              {isQuotePhase && primaryContact && (
                <p className="text-xs text-gray-400 mt-1">
                  Send this quote to {primaryContact.firstName} {primaryContact.lastName} for approval
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {quoteApprovals.map((approval: any) => (
                <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{approval.clientName || approval.clientEmail}</p>
                    <p className="text-xs text-gray-500">{approval.clientEmail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {approval.viewedAt && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Eye className="w-3 h-3" />
                        Viewed {format(new Date(approval.viewedAt), "MMM d")}
                      </div>
                    )}
                    <Badge
                      variant={
                        approval.status === "approved"
                          ? "default"
                          : approval.status === "declined"
                            ? "destructive"
                            : "secondary"
                      }
                      className={
                        approval.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : ""
                      }
                    >
                      {approval.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {approval.status === "declined" && <XCircle className="w-3 h-3 mr-1" />}
                      {approval.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                      {approval.status?.charAt(0).toUpperCase() + approval.status?.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden quote template for PDF generation */}
      <QuoteTemplate
        ref={quoteRef}
        order={order}
        orderItems={orderItems}
        companyName={companyName}
        primaryContact={primaryContact}
        allArtworkItems={allArtworkItems}
        serviceCharges={data.serviceCharges}
        assignedUser={data.assignedUser}
      />

      {/* Document Editor Modal */}
      {previewDocument && (
        <DocumentEditor
          document={previewDocument}
          order={order}
          orderItems={orderItems}
          companyName={companyName}
          primaryContact={primaryContact}
          getEditedItem={getEditedItem}
          onClose={() => setPreviewDocument(null)}
          allArtworkItems={allArtworkItems}
        />
      )}

      {showSendDialog && quoteDocuments.length > 0 && (
        <SendQuoteDialog
          open={showSendDialog}
          onOpenChange={setShowSendDialog}
          projectId={props.projectId}
          recipientEmail={primaryContact?.email || ""}
          recipientName={primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName}
          companyName={companyName}
          orderNumber={(order as any)?.orderNumber || ""}
          quoteDocument={quoteDocuments[0]}
          primaryContact={primaryContact}
          quoteTotal={Number(order.total || 0)}
          quoteApprovals={quoteApprovals}
          createQuoteApproval={createQuoteApproval}
          contacts={contactsList}
        />
      )}

      {showConversionDialog && (
        <StageConversionDialog
          open={showConversionDialog}
          onOpenChange={setShowConversionDialog}
          targetStage="sales_order"
          projectId={props.projectId}
          enrichedItems={enrichedItems}
          onSuccess={handleConversionSuccess}
        />
      )}
    </div>
  );
}
