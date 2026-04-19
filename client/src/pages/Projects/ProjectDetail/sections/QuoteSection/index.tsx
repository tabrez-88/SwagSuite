import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import EditableAddress from "@/components/shared/EditableAddress";
import ProjectInfoBar from "@/components/layout/ProjectInfoBar";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowRight,
  Calculator,
  CheckCircle,
  Clock,
  ClipboardList,
  Eye,
  FileText,
  Info,
  Loader2,
  MapPin,
  Pencil,
  Send,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import LockBanner from "@/components/shared/LockBanner";
import StageConversionDialog from "../../components/StageConversionDialog";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { DocumentEditor } from "@/components/feature/DocumentEditor";
import { PdfPreviewDialog } from "@/components/documents/pdf/PdfPreviewDialog";
import SendQuoteDialog from "@/components/modals/SendQuoteDialog";
import ProductsSection from "@/components/sections/ProductsSection";
import { Separator } from "@/components/ui/separator";

import { useQuoteSection } from "./hooks";
import { quoteStatuses } from "./types";
import { getEditedItem } from "@/lib/projectDetailUtils";
import type { QuoteSectionProps } from "./types";
import { useToast } from "@/hooks/use-toast";
import { usePaymentTerms } from "@/services/payment-terms";
import { useTaxCodes } from "@/services/tax-codes";
import { useCalculateTax } from "@/services/projects/mutations";

export default function QuoteSection(props: QuoteSectionProps) {
  const { toast } = useToast();
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
    deleteDocument,
    createQuoteApproval,
    buildQuoteDoc,
    showLivePreview,
    setShowLivePreview,
    handlePreviewLive,
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

  const { data: paymentTermsOptions = [] } = usePaymentTerms();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: taxCodes } = useTaxCodes();

  const _calculateTax = useCalculateTax(props.projectId);
  const calculateTaxMutation = {
    ..._calculateTax,
    mutate: () =>
      _calculateTax.mutate(undefined, {
        onSuccess: () =>
          toast({ title: "Tax Calculated", description: "Tax has been updated based on TaxJar rates." }),
        onError: (error: Error) =>
          toast({ title: "Tax Calculation Failed", description: error.message, variant: "destructive" }),
      }),
  };

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

        {!isLocked && (
          <div className="flex items-center gap-2">
            <Switch
              id="auto-approve-so"
              checked={(order?.stageData as Record<string, unknown>)?.quoteAutoApproveSo !== false}
              onCheckedChange={(checked) => {
                const currentStageData = order?.stageData || {};
                updateField({
                  stageData: { ...currentStageData, quoteAutoApproveSo: checked },
                });
              }}
              disabled={isFieldPending}
            />
            <Label htmlFor="auto-approve-so" className="text-sm text-muted-foreground cursor-pointer">
              Auto-approve SO on quote acceptance
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p className="text-xs">When ON, the Sales Order will be automatically set to "Client Approved" when the client accepts the quote. When OFF, the SO will require separate review and approval.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Quote Details — read-only display */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Quote Details
            </CardTitle>
            {!isLocked && (
              <Button variant="outline" size="sm" className="h-8" onClick={() => setShowEditDialog(true)}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Quote Date</span>
              <span className="text-sm font-medium">
                {order?.createdAt
                  ? format(new Date(order!.createdAt), "MMM d, yyyy")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">In-Hands Date</span>
              <span className="text-sm font-medium">
                {order?.inHandsDate ? format(new Date(order!.inHandsDate), "MMM d, yyyy") : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Supplier In-Hands</span>
              <span className="text-sm font-medium">
                {order?.supplierInHandsDate ? format(new Date(order!.supplierInHandsDate), "MMM d, yyyy") : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Customer PO</span>
              <span className="text-sm font-medium">{order?.customerPo || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment Terms</span>
              <span className="text-sm font-medium">{order?.paymentTerms || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Currency</span>
              <span className="text-sm font-medium">{order?.currency || "USD"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tax Code</span>
              <span className="text-sm font-medium">
                {taxCodes?.find((tc) => String(tc.id) === order?.defaultTaxCodeId)?.label || "None"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tax</span>
              <div className="flex items-center gap-2">
                {(() => {
                  const taxAmount = Number(order?.tax || 0);
                  const activeTaxCode = taxCodes?.find((tc) => String(tc.id) === order?.defaultTaxCodeId);
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
                {!isLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => calculateTaxMutation.mutate()}
                    disabled={calculateTaxMutation.isPending}
                  >
                    {calculateTaxMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Calculator className="h-3 w-3 mr-1.5" />
                    )}
                    Calculate Tax
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="col-span-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Introduction</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order?.quoteIntroduction || <span className="text-gray-400 italic">No introduction</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Supplier Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order?.supplierNotes || <span className="text-gray-400 italic">No supplier notes</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Additional Information</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order?.additionalInformation || <span className="text-gray-400 italic">No additional info</span>}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quote Details Edit Dialog */}
      <QuoteEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        order={order}
        updateField={updateField}
        isFieldPending={isFieldPending}
        paymentTermsOptions={paymentTermsOptions}
        taxCodes={taxCodes || []}
      />

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableAddress
          title="Billing Address"
          addressJson={order?.billingAddress}
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
          addressJson={order?.shippingAddress}
          field="shippingAddress"
          onSave={updateField}
          isLocked={isLocked}
          isPending={isFieldPending}
          icon={<MapPin className="w-4 h-4" />}
          companyId={order?.companyId}
          primaryContact={primaryContact}
          billingAddressJson={order?.billingAddress}
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
                <Button size="sm" onClick={() => setShowSendDialog(true)}>
                  <Send className="w-4 h-4 mr-1.5" />
                  Send to Client
                </Button>
              )}
              {quoteDocuments.length === 0 && orderItems.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleGenerateQuote}
                  disabled={isGenerating || isLocked}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-1.5" />
                  )}
                  Generate Quote PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {quoteDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quote document generated yet</h3>
              {orderItems.length > 0 && (
                <p className="text-sm text-gray-500">Click "Generate Quote PDF" to create a professional quote</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {quoteDocuments.map((doc) => (
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
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No approval requests sent yet</h3>
              {isQuotePhase && primaryContact && (
                <p className="text-sm text-gray-500">
                  Send this quote to {primaryContact.firstName} {primaryContact.lastName} for approval
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {quoteApprovals.map((approval) => (
                <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{approval.clientName || approval.clientEmail}</p>
                    <p className="text-xs text-gray-500">{approval.clientEmail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    
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
                    {approval.viewedAt && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Eye className="w-3 h-3" />
                        Viewed {format(new Date(approval.viewedAt), "MMM d")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live PDF preview (uses react-pdf PDFViewer — same renderer as save) */}
      <PdfPreviewDialog
        open={showLivePreview}
        onOpenChange={setShowLivePreview}
        title={`Quote Preview — ${order?.orderNumber || ""}`}
        document={showLivePreview ? buildQuoteDoc() : null}
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
          orderNumber={order?.orderNumber || ""}
          quoteDocument={quoteDocuments[0]}
          primaryContact={primaryContact}
          quoteTotal={Number(order.total || 0)}
          quoteApprovals={quoteApprovals}
          createQuoteApproval={createQuoteApproval}
          contacts={contactsList}
          assignedUserEmail={data?.assignedUser?.email}
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

// ── Quote Details Edit Dialog ─────────────────────────────────────
function QuoteEditDialog({
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic form dialog with many order fields
  order: any;
  updateField: (fields: Record<string, unknown>, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void;
  isFieldPending: boolean;
  paymentTermsOptions: Array<{ name: string }>;
  taxCodes: Array<{ id: string | number; label: string; rate?: string | number; isExempt?: boolean }>;
}) {
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic form state
  const [form, setForm] = useState<Record<string, any>>({});

  // Populate form when dialog opens
  React.useEffect(() => {
    if (open) {
      setForm({
        inHandsDate: order?.inHandsDate ? new Date(order.inHandsDate).toISOString().split("T")[0] : "",
        supplierInHandsDate: order?.supplierInHandsDate ? new Date(order.supplierInHandsDate).toISOString().split("T")[0] : "",
        customerPo: order?.customerPo || "",
        paymentTerms: order?.paymentTerms || "",
        currency: order?.currency || "USD",
        defaultTaxCodeId: order?.defaultTaxCodeId || "none",
        quoteIntroduction: order?.quoteIntroduction || "",
        supplierNotes: order?.supplierNotes || "",
        additionalInformation: order?.additionalInformation || "",
      });
    }
  }, [open]);

  const handleSave = () => {
    const payload: Record<string, any> = { ...form };
    if (payload.defaultTaxCodeId === "none") payload.defaultTaxCodeId = null;
    if (!payload.inHandsDate) payload.inHandsDate = null;
    if (!payload.supplierInHandsDate) payload.supplierInHandsDate = null;
    updateField(payload, {
      onSuccess: () => {
        toast({ title: "Quote details updated" });
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
          <DialogTitle>Edit Quote Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
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
              <Label className="text-xs text-gray-500">Supplier In-Hands Date</Label>
              <Input
                type="date"
                value={form.supplierInHandsDate || ""}
                onChange={(e) => setForm({ ...form, supplierInHandsDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Customer PO</Label>
              <Input
                value={form.customerPo || ""}
                onChange={(e) => setForm({ ...form, customerPo: e.target.value })}
                placeholder="Enter PO #"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Payment Terms</Label>
              <Select value={form.paymentTerms || ""} onValueChange={(val) => setForm({ ...form, paymentTerms: val })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select terms" /></SelectTrigger>
                <SelectContent>
                  {paymentTermsOptions.map((t) => (
                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Currency</Label>
              <Input
                value={form.currency || ""}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="USD"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Tax Code</Label>
              <Select value={form.defaultTaxCodeId || "none"} onValueChange={(val) => setForm({ ...form, defaultTaxCodeId: val })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tax code" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {taxCodes.map((tc) => (
                    <SelectItem key={tc.id} value={String(tc.id)}>
                      {tc.label} {tc.rate ? `(${tc.rate}%)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Introduction</Label>
            <Textarea
              value={form.quoteIntroduction || ""}
              onChange={(e) => setForm({ ...form, quoteIntroduction: e.target.value })}
              placeholder="Introduction message for the quote (visible to client)..."
              className="mt-1 min-h-[80px]"
            />
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
