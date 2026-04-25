import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { PdfPreviewDialog } from "@/components/documents/pdf/PdfPreviewDialog";
import { DocumentEditor } from "@/components/feature/DocumentEditor";
import ProjectInfoBar from "@/components/layout/ProjectInfoBar";
import SendSODialog from "@/components/modals/SendSODialog";
import ProductsSection from "@/components/sections/ProductsSection";
import EditableAddress from "@/components/shared/EditableAddress";
import LockBanner from "@/components/shared/LockBanner";
import TimelineWarningBanner from "@/components/shared/TimelineWarningBanner";
import {
  AlertDialog,
  AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePaymentTerms } from "@/services/payment-terms";
import { useCalculateTax } from "@/services/projects/mutations";
import { useTaxCodes } from "@/services/tax-codes";
import { format } from "date-fns";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Copy,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Send
} from "lucide-react";
import React, { useState } from "react";
import { useSalesOrderSection } from "./hooks";
import type { SalesOrderSectionProps } from "./types";

export default function SalesOrderSection(props: SalesOrderSectionProps) {
  const { projectId, lockStatus } = props;
  const hook = useSalesOrderSection(props);
  const { toast } = useToast();

  const { data: paymentTermsOptions = [] } = usePaymentTerms();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: taxCodes } = useTaxCodes();

  const _calculateTax = useCalculateTax(projectId);
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

          {/* Deposit Status Badge */}
          {hook.order.depositPercent && Number(hook.order.depositPercent) > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Deposit</label>
              {hook.order.depositStatus === "received" ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">Deposit Received</Badge>
              ) : hook.order.depositStatus === "pending" ? (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">Deposit Pending</Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Deposit Required</Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={hook.handleDuplicate}
            disabled={hook.isDuplicating}
          >
            {hook.isDuplicating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Copy className="w-4 h-4 mr-1.5" />}
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
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setShowEditDialog(true)}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
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
                  <span className="text-sm font-medium">{hook.order?.paymentTerms || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Customer PO</span>
                  <span className="text-sm font-medium">{hook.order?.customerPo || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Default Margin</span>
                  <span className="text-sm font-medium">{hook.order?.margin ? `${hook.order!.margin}%` : "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Discount</span>
                  <span className="text-sm font-medium">{hook.order?.orderDiscount ? `${hook.order!.orderDiscount}%` : "—"}</span>
                </div>
                {hook.order?.depositPercent && Number(hook.order.depositPercent) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Deposit</span>
                    <span className="text-sm font-medium">
                      {hook.order.depositPercent}% (${Number(hook.order.depositAmount || 0).toLocaleString()})
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tax Code</span>
                  <span className="text-sm font-medium">
                    {taxCodes?.find((tc) => String(tc.id) === hook.order?.defaultTaxCodeId)?.label || "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tax</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const taxAmount = Number(hook.order?.tax || 0);
                      const activeTaxCode = taxCodes?.find((tc) => String(tc.id) === hook.order?.defaultTaxCodeId);
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
                    {hook.order?.supplierInHandsDate ? format(new Date(hook.order!.supplierInHandsDate), "MMM d, yyyy") : "—"}
                  </span>
                </div>
              </div>

              {/* Firm / Rush badges */}
              <div className="flex items-center gap-3">
                {hook.order?.isFirm && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Firm Order</Badge>
                )}
                {hook.order?.isRush && (
                  <Badge variant="destructive" className="text-xs">Rush Order</Badge>
                )}
              </div>

              {/* Supplier Notes & Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Supplier Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{hook.order?.supplierNotes || <span className="text-gray-400 italic">No supplier notes</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Additional Information</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{hook.order?.additionalInformation || <span className="text-gray-400 italic">No additional info</span>}</p>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableAddress
              title="Billing Address"
              addressJson={hook.order?.billingAddress}
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
              addressJson={hook.order?.shippingAddress}
              field="shippingAddress"
              onSave={hook.updateField}
              isLocked={hook.isLocked}
              isPending={hook.isFieldPending}
              icon={<MapPin className="w-4 h-4" />}
              companyId={hook.order?.companyId}
              primaryContact={hook.primaryContact}
              billingAddressJson={hook.order?.billingAddress}
            />
          </div>
        </>
      )}

      <ProductsSection projectId={projectId} data={hook.data} isLocked={hook.isLocked} />

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
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Send to Client
                </Button>
              )}
              {hook.soDocuments.length === 0 && hook.orderItems.length > 0 && (
                <Button
                  size="sm"
                  onClick={hook.handleGenerateSO}
                  disabled={hook.isGenerating || hook.isLocked}
                >
                  {hook.isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-1.5" />
                  )}
                  Generate Sales Order PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hook.soDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales order document generated yet</h3>
              {hook.orderItems.length > 0 && (
                <p className="text-sm text-gray-500">Click "Generate Sales Order PDF" to create a professional document</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {hook.soDocuments.map((doc) => (
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
          orderNumber={hook.order?.orderNumber || ""}
          soDocument={hook.soDocuments[0]}
          soTotal={hook.soTotal}
          quoteApprovals={hook.quoteApprovals}
          createQuoteApproval={hook.createQuoteApproval}
          contacts={hook.contactsList}
          assignedUserEmail={hook.data?.assignedUser?.email}
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
                  {paymentTermsOptions.map((t) => (
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
                  {taxCodes.map((tc) => (
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
