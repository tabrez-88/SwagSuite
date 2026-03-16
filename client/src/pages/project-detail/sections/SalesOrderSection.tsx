import { useState, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Clock,
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
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { EditableText, EditableDate, EditableSelect, EditableTextarea } from "@/components/InlineEditable";
import EditableAddress from "@/components/EditableAddress";
import ProjectInfoBar from "@/components/ProjectInfoBar";
import { hasTimelineConflict } from "@/lib/dateUtils";
import TimelineWarningBanner from "@/components/TimelineWarningBanner";
import type { useProjectData } from "../hooks/useProjectData";
import type { SectionLockStatus } from "@/hooks/useLockStatus";
import LockBanner from "@/components/LockBanner";
import { useDocumentGeneration, buildItemsHash } from "@/hooks/useDocumentGeneration";
import SalesOrderTemplate from "@/components/documents/SalesOrderTemplate";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { DocumentEditor } from "@/components/DocumentEditor";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";
import SendSODialog from "@/components/modals/SendSODialog";

import ProductsSection from "@/components/sections/ProductsSection";

interface SalesOrderSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
  lockStatus?: SectionLockStatus;
}

const salesOrderStatuses = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "pending_client_approval", label: "Pending Client Approval", color: "bg-yellow-100 text-yellow-800" },
  { value: "client_change_requested", label: "Client Change Requested", color: "bg-orange-100 text-orange-800" },
  { value: "client_approved", label: "Client Approved", color: "bg-green-100 text-green-800" },
  { value: "in_production", label: "In Production", color: "bg-purple-100 text-purple-800" },
  { value: "shipped", label: "Shipped", color: "bg-indigo-100 text-indigo-800" },
  { value: "ready_to_invoice", label: "Ready To Be Invoiced", color: "bg-teal-100 text-teal-800" },
];

const proofStatuses: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  awaiting_proof: { label: "Awaiting Proof", color: "bg-yellow-100 text-yellow-800" },
  proof_received: { label: "Proof Received", color: "bg-blue-100 text-blue-800" },
  pending_approval: { label: "Pending Approval", color: "bg-orange-100 text-orange-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  change_requested: { label: "Change Requested", color: "bg-red-100 text-red-800" },
  proofing_complete: { label: "Proofing Complete", color: "bg-teal-100 text-teal-800" },
};

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

export default function SalesOrderSection({ orderId, data, lockStatus }: SalesOrderSectionProps) {
  const { order, orderItems, companyName, primaryContact, contacts, allArtworkItems } = data;
  const [, setLocation] = useLocation();
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const soRef = useRef<HTMLDivElement>(null);

  const {
    soDocuments,
    quoteApprovals,
    isGenerating,
    generateDocument,
    deleteDocument,
    createQuoteApproval,
    isDeleting,
  } = useDocumentGeneration(orderId);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PATCH", `/api/orders/${orderId}`, {
        salesOrderStatus: newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const duplicateOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/duplicate`);
      return res;
    },
    onSuccess: (data: any) => {
      toast({ title: "Order duplicated!", description: `New order #${data.order?.orderNumber} created` });
      setLocation(`/project/${data.order?.id}`);
    },
    onError: () => {
      toast({ title: "Failed to duplicate order", variant: "destructive" });
    },
  });

  // SO document generation
  const currentSOHash = useMemo(() => {
    return buildItemsHash(orderItems, "sales_order", order);
  }, [orderItems, order]);

  const isSOStale = (doc: any) => {
    const storedHash = doc.metadata?.itemsHash;
    if (!storedHash) return false;
    return storedHash !== currentSOHash;
  };

  const handleGenerateSO = async () => {
    if (!soRef.current || orderItems.length === 0) return;
    try {
      await generateDocument({
        elementRef: soRef.current,
        documentType: "sales_order",
        documentNumber: (order as any)?.orderNumber || "DRAFT",
        itemsHash: currentSOHash,
      });
      toast({ title: "Sales Order PDF generated successfully" });
    } catch {
      // Error handled by hook
    }
  };

  const handleRegenerateSO = async (docId: string) => {
    await deleteDocument(docId);
    await new Promise((r) => setTimeout(r, 300));
    await handleGenerateSO();
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

  const currentStatus = (order as any)?.salesOrderStatus || "new";
  const statusInfo = salesOrderStatuses.find((s) => s.value === currentStatus) || salesOrderStatuses[0];

  const isLocked = lockStatus?.isLocked ?? false;
  const { updateField, isPending: isFieldPending } = useInlineEdit({ orderId, isLocked });
  const timelineConflicts = hasTimelineConflict(order);

  return (
    <div className="space-y-6">
      {lockStatus && <LockBanner lockStatus={lockStatus} sectionName="Sales Order" sectionKey="salesOrder" orderId={orderId} />}
      <TimelineWarningBanner conflicts={timelineConflicts} />

      <ProjectInfoBar companyName={companyName} primaryContact={primaryContact} />

      {/* Sales Order Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Status */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <Select value={currentStatus} onValueChange={(val) => updateStatusMutation.mutate(val)} disabled={isLocked}>
              <SelectTrigger className="w-[220px] h-9">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${statusInfo.color.split(" ")[0]}`} />
                    {statusInfo.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {salesOrderStatuses.map((s) => (
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
            <span className="text-sm font-medium">{order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy") : "—"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!confirm("Duplicate this order? A new project will be created with all items and settings copied.")) return;
              duplicateOrderMutation.mutate();
            }}
            disabled={duplicateOrderMutation.isPending}
            className="gap-1.5"
          >
            {duplicateOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Duplicate Order
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsInfoCollapsed(!isInfoCollapsed)}
          >
          {isInfoCollapsed ? (
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

      {/* Collapsible Order Info Section — inline editable */}
      {!isInfoCollapsed && (
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
                  value={order.notes || ""}
                  field="notes"
                  onSave={updateField}
                  placeholder="Order introduction / notes..."
                  emptyText="No introduction"
                  rows={2}
                  isLocked={isLocked}
                  isPending={isFieldPending}
                />
              </div>

              {/* Terms, Dates, Firm */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payment Terms</span>
                  <EditableSelect
                    value={(order as any)?.paymentTerms || "net_30"}
                    field="paymentTerms"
                    onSave={updateField}
                    options={[
                      { value: "net_30", label: "Net 30" },
                      { value: "net_15", label: "Net 15" },
                      { value: "net_60", label: "Net 60" },
                      { value: "credit_card", label: "Credit Card" },
                      { value: "due_on_receipt", label: "Due on Receipt" },
                      { value: "prepaid", label: "Prepaid" },
                    ]}
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
                    placeholder="PO #"
                    emptyText="Not set"
                    isLocked={isLocked}
                    isPending={isFieldPending}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Default Margin</span>
                  <EditableText
                    value={String((order as any)?.margin || "")}
                    field="margin"
                    onSave={updateField}
                    type="number"
                    suffix="%"
                    placeholder="0"
                    emptyText="Not set"
                    isLocked={isLocked}
                    isPending={isFieldPending}
                  />
                </div>
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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">In-Hands Date</span>
                  <EditableDate
                    value={order.inHandsDate}
                    field="inHandsDate"
                    onSave={updateField}
                    isLocked={isLocked}
                    isPending={isFieldPending}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Event Date</span>
                  <EditableDate
                    value={order.eventDate}
                    field="eventDate"
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
              </div>

              {/* Firm / Rush toggles */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isFirmSO"
                    checked={(order as any)?.isFirm || false}
                    onCheckedChange={(checked) => updateField({ isFirm: !!checked })}
                    disabled={isLocked}
                  />
                  <Label htmlFor="isFirmSO" className="text-sm font-normal cursor-pointer">Firm Order</Label>
                </div>
                {(order as any)?.isRush && (
                  <Badge variant="destructive" className="text-xs">Rush Order</Badge>
                )}
              </div>

              {/* Supplier Notes & Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
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

          {/* Addresses — inline editable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableAddress
              title="Billing Address"
              addressJson={(order as any)?.billingAddress}
              field="billingAddress"
              onSave={updateField}
              isLocked={isLocked}
              isPending={isFieldPending}
              icon={<CreditCard className="w-4 h-4" />}
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
              {soDocuments.length > 0 && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setShowSendDialog(true)}
                  disabled={isLocked}
                  className="gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Send to Client
                </Button>
              )}
              {soDocuments.length === 0 && orderItems.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleGenerateSO}
                  disabled={isGenerating || isLocked}
                  className="gap-1.5"
                >
                  {isGenerating ? (
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
          {soDocuments.length === 0 ? (
            <div className="text-center py-4">
              <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No sales order document generated yet</p>
              {orderItems.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">Click "Generate Sales Order PDF" to create a professional document</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {soDocuments.map((doc: any) => (
                <GeneratedDocumentCard
                  key={doc.id}
                  document={doc}
                  isStale={isSOStale(doc)}
                  onPreview={() => setPreviewDocument(doc)}
                  onDelete={() => deleteDocument(doc.id)}
                  onRegenerate={isLocked ? undefined : () => handleRegenerateSO(doc.id)}
                  onGetApprovalLink={isLocked ? undefined : () => handleGetApprovalLink(doc)}
                  isDeleting={isDeleting || isLocked}
                  isRegenerating={isGenerating}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products / Services / Artwork Tabs - CommonSKU style */}
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

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          <ProductsSection orderId={orderId} data={data} isLocked={isLocked} />
        </TabsContent>

        {/* Artwork & Proofing Tab */}
        <TabsContent value="artwork" className="mt-4">
          <SalesOrderArtwork orderId={orderId} data={data} isLocked={isLocked} />
        </TabsContent>
      </Tabs>

      {/* Hidden SO template for PDF generation */}
      <SalesOrderTemplate
        ref={soRef}
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

      {/* Send SO to Client Dialog */}
      {showSendDialog && soDocuments.length > 0 && (
        <SendSODialog
          open={showSendDialog}
          onOpenChange={setShowSendDialog}
          orderId={orderId}
          recipientEmail={primaryContact?.email || ""}
          recipientName={primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName}
          companyName={companyName}
          orderNumber={(order as any)?.orderNumber || ""}
          soDocument={soDocuments[0]}
          soTotal={orderItems.reduce((sum: number, item: any) => sum + (parseFloat(item.unitPrice) || 0) * (item.quantity || 0), 0)}
          quoteApprovals={quoteApprovals}
          createQuoteApproval={createQuoteApproval}
        />
      )}
    </div>
  );
}

// ── Artwork Sub-component (view-only, proofing is in PO section) ─────────────
function SalesOrderArtwork({ orderId, data, isLocked }: { orderId: string; data: ReturnType<typeof useProjectData>; isLocked: boolean }) {
  const { allArtworkItems, orderItems, suppliers } = data;
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  // Flatten artworks with product info
  const artworks: any[] = [];
  if (allArtworkItems && typeof allArtworkItems === "object") {
    Object.entries(allArtworkItems).forEach(([itemId, arts]: [string, any[]]) => {
      const item = orderItems.find((i: any) => i.id === itemId);
      const supplier = item?.supplierId ? suppliers?.find((s: any) => s.id === item.supplierId) : null;
      arts.forEach((art: any) => {
        artworks.push({
          ...art,
          productName: item?.productName || "Unknown Product",
          productSku: item?.productSku || "",
          supplierName: supplier?.name || item?.supplierName || "Unknown Vendor",
        });
      });
    });
  }

  const statusCounts = artworks.reduce((acc: Record<string, number>, art) => {
    const s = art.status || "pending";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

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
      {Object.keys(statusCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => {
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
                      <img src={art.fileUrl || art.filePath} alt={art.name || "Artwork"} className="w-full h-full object-contain p-1" />
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
                      <span className="text-xs text-gray-400">Vendor: {art.supplierName}</span>
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
                      <img src={art.proofFilePath} alt="Proof" className="w-full h-full object-contain p-0.5" />
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
