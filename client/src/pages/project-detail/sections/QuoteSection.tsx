import { useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { EditableText, EditableDate, EditableTextarea } from "@/components/InlineEditable";
import EditableAddress from "@/components/EditableAddress";
import ProjectInfoBar from "@/components/ProjectInfoBar";
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
import type { useProjectData } from "../hooks/useProjectData";
import type { SectionLockStatus } from "@/hooks/useLockStatus";
import LockBanner from "@/components/LockBanner";
import StageConversionDialog from "../components/StageConversionDialog";
import { useDocumentGeneration, buildItemsHash } from "@/hooks/useDocumentGeneration";
import QuoteTemplate from "@/components/documents/QuoteTemplate";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { DocumentEditor } from "@/components/DocumentEditor";
import SendQuoteDialog from "@/components/modals/SendQuoteDialog";
import ProductsSection from "@/components/sections/ProductsSection";
import { Separator } from "@/components/ui/separator";

const quoteStatuses = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "sent", label: "Sent to Client", color: "bg-blue-100 text-blue-800" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "expired", label: "Expired", color: "bg-yellow-100 text-yellow-800" },
];

function getEditedItem(_id: string, item: any) {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productSku: item.productSku,
    supplierId: item.supplierId,
    color: item.color || "",
    quantity: item.quantity || 0,
    unitPrice: parseFloat(item.unitPrice) || 0,
    cost: parseFloat(item.cost || 0),
    decorationCost: parseFloat(item.decorationCost || 0),
    charges: parseFloat(item.charges || 0),
    margin: 44,
    sizePricing: item.sizePricing || {},
  };
}

interface QuoteSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
  lockStatus?: SectionLockStatus;
}

export default function QuoteSection({ orderId, data, lockStatus }: QuoteSectionProps) {
  const { order, orderItems, quoteApprovals, companyName, primaryContact, allProducts, allArtworkItems } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  const {
    quoteDocuments,
    isGenerating,
    generateDocument,
    deleteDocument,
    createQuoteApproval,
    isDeleting,
  } = useDocumentGeneration(orderId);

  const enrichedItems = useMemo(() => {
    return orderItems.map((item: any) => {
      const product = allProducts.find((p: any) => p.id === item.productId);
      return {
        ...item,
        imageUrl: item.productImageUrl || product?.imageUrl || null,
      };
    });
  }, [orderItems, allProducts]);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PATCH", `/api/orders/${orderId}`, {
        quoteStatus: newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  // Stale detection for quote documents
  const currentQuoteHash = useMemo(() => {
    return buildItemsHash(orderItems, "quote", order);
  }, [orderItems, order]);

  const isQuoteStale = (doc: any) => {
    const storedHash = doc.metadata?.itemsHash;
    if (!storedHash) return false;
    return storedHash !== currentQuoteHash;
  };

  const handleGenerateQuote = async () => {
    if (!quoteRef.current || orderItems.length === 0) return;
    try {
      await generateDocument({
        elementRef: quoteRef.current,
        documentType: "quote",
        documentNumber: (order as any)?.orderNumber || "DRAFT",
        itemsHash: currentQuoteHash,
      });
      toast({ title: "Quote PDF generated successfully" });
    } catch {
      // Error handled by hook
    }
  };

  const handleRegenerateQuote = async (docId: string) => {
    await deleteDocument(docId);
    // Short delay for cleanup
    await new Promise((r) => setTimeout(r, 300));
    await handleGenerateQuote();
  };

  const handleGetApprovalLink = async (doc: any) => {
    const existingApproval = quoteApprovals.find((a: any) => a.status === "pending");
    if (existingApproval) {
      const approvalUrl = `${window.location.origin}/client-approval/${existingApproval.approvalToken}`;
      navigator.clipboard.writeText(approvalUrl);
      toast({ title: "Approval Link Copied", description: "The existing approval link has been copied to clipboard." });
      return;
    }
    try {
      const result = await createQuoteApproval({
        clientEmail: primaryContact?.email || "",
        clientName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName,
        documentId: doc.id,
        pdfPath: doc.fileUrl,
        quoteTotal: (order as any)?.total,
      });
      const approvalUrl = `${window.location.origin}/client-approval/${result.approvalToken}`;
      navigator.clipboard.writeText(approvalUrl);
      toast({ title: "Approval Link Generated", description: "Link copied to clipboard." });
    } catch {
      toast({ title: "Error", description: "Failed to generate approval link", variant: "destructive" });
    }
  };

  if (!order) return null;

  const currentStatus = (order as any)?.quoteStatus || "draft";
  const statusInfo = quoteStatuses.find((s) => s.value === currentStatus) || quoteStatuses[0];
  const isQuotePhase = currentStatus === "draft" || currentStatus === "sent";

  const totalItems = orderItems.length;
  const totalQty = orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  // Use order.subtotal from DB (calculated server-side by recalculateOrderTotals)
  const subtotal = Number(order.subtotal || 0);
  // Discount hidden for now — kept in schema but not applied to UI calculations
  const tax = Number(order.tax || 0);
  const shipping = Number(order.shipping || 0);
  const total = subtotal + tax + shipping;

  const isLocked = lockStatus?.isLocked ?? false;
  const { updateField, isPending: isFieldPending } = useInlineEdit({ orderId, isLocked });

  return (
    <div className="space-y-6">
      {lockStatus && <LockBanner lockStatus={lockStatus} sectionName="Quote" sectionKey="quote" orderId={orderId} />}

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

      {/* Quote Products */}
      <ProductsSection orderId={orderId} data={data} isLocked={isLocked} />

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
      {
        previewDocument && (
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
        )
      }

      {
        showSendDialog && quoteDocuments.length > 0 && (
          <SendQuoteDialog
            open={showSendDialog}
            onOpenChange={setShowSendDialog}
            orderId={orderId}
            recipientEmail={primaryContact?.email || ""}
            recipientName={primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName}
            companyName={companyName}
            orderNumber={(order as any)?.orderNumber || ""}
            quoteDocument={quoteDocuments[0]}
            primaryContact={primaryContact}
            quoteTotal={Number(order.total || 0)}
            quoteApprovals={quoteApprovals}
            createQuoteApproval={createQuoteApproval}
          />
        )
      }

      {
        showConversionDialog && (
          <StageConversionDialog
            open={showConversionDialog}
            onOpenChange={setShowConversionDialog}
            targetStage="sales_order"
            orderId={orderId}
            enrichedItems={enrichedItems}
            onSuccess={() => {
              setShowConversionDialog(false);
              queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
              queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
            }}
          />
        )
      }
    </div >
  );
}
