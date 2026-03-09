import { useState, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Clock,
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
  const { order, orderItems, companyName, primaryContact, contacts } = data;
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

  const updateFieldMutation = useMutation({
    mutationFn: async (fields: Record<string, any>) => {
      await apiRequest("PATCH", `/api/orders/${orderId}`, fields);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
    },
    onError: () => {
      toast({ title: "Failed to update field", variant: "destructive" });
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

  if (!order) return null;

  const currentStatus = (order as any)?.salesOrderStatus || "new";
  const statusInfo = salesOrderStatuses.find((s) => s.value === currentStatus) || salesOrderStatuses[0];

  // Parse addresses
  const billingAddr = (() => {
    try {
      return (order as any)?.billingAddress ? JSON.parse((order as any).billingAddress) : null;
    } catch {
      return null;
    }
  })();

  const shippingAddr = (() => {
    try {
      return (order as any)?.shippingAddress ? JSON.parse((order as any).shippingAddress) : null;
    } catch {
      return null;
    }
  })();

  const isLocked = lockStatus?.isLocked ?? false;
  const timelineConflicts = hasTimelineConflict(order);

  return (
    <div className="space-y-6">
      {lockStatus && <LockBanner lockStatus={lockStatus} sectionName="Sales Order" sectionKey="salesOrder" orderId={orderId} />}
      <TimelineWarningBanner conflicts={timelineConflicts} />

      {/* Sales Order Header - CommonSKU style */}
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

          {/* Sales Order Date */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Sales Order Date</label>
            <Input
              type="date"
              defaultValue={order.createdAt ? format(new Date(order.createdAt), "yyyy-MM-dd") : ""}
              className="w-[160px] h-9"
              disabled={isLocked}
            />
          </div>
        </div>

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

      {/* Collapsible Order Info Section */}
      {!isInfoCollapsed && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            {/* Introduction */}
            {order.notes && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Introduction</label>
                <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-md p-3">{order.notes}</p>
              </div>
            )}

            {/* Main info grid - matching CommonSKU layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Billing Address */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  Billing Address
                </h4>
                {billingAddr ? (
                  <div className="text-sm text-gray-600 space-y-0.5">
                    {billingAddr.contactName && <p className="font-medium">{billingAddr.contactName}</p>}
                    <p>{companyName}</p>
                    {billingAddr.street && <p>{billingAddr.street}</p>}
                    <p>
                      {[billingAddr.city, billingAddr.state, billingAddr.zipCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {billingAddr.email && (
                      <p className="text-blue-600">{billingAddr.email}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Not set</p>
                )}
              </div>

              {/* Main Shipping Address */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Main Shipping Address
                </h4>
                {shippingAddr ? (
                  <div className="text-sm text-gray-600 space-y-0.5">
                    {shippingAddr.contactName && <p className="font-medium">{shippingAddr.contactName}</p>}
                    <p>{companyName}</p>
                    {(shippingAddr.street || shippingAddr.address) && (
                      <p>{shippingAddr.street || shippingAddr.address}</p>
                    )}
                    <p>
                      {[shippingAddr.city, shippingAddr.state, shippingAddr.zipCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {shippingAddr.email && (
                      <p className="text-blue-600">{shippingAddr.email}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Not set</p>
                )}
              </div>

              {/* Terms, Dates, Currency, Margin, Customer PO */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Terms</label>
                    <Select defaultValue={(order as any)?.paymentTerms || "net_30"} disabled={isLocked}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="net_30">Net 30</SelectItem>
                        <SelectItem value="net_15">Net 15</SelectItem>
                        <SelectItem value="net_60">Net 60</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                        <SelectItem value="prepaid">Prepaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
                    <Select defaultValue="USD" disabled={isLocked}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">In Hands Date</label>
                  <Input
                    type="date"
                    defaultValue={order.inHandsDate ? format(new Date(order.inHandsDate), "yyyy-MM-dd") : ""}
                    className="h-8 text-sm"
                    disabled={isLocked}
                    onBlur={(e) => {
                      const newVal = e.target.value || null;
                      const oldVal = order.inHandsDate ? format(new Date(order.inHandsDate), "yyyy-MM-dd") : "";
                      if (newVal !== oldVal) updateFieldMutation.mutate({ inHandsDate: newVal });
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Supplier In-Hands</label>
                    <Input
                      type="date"
                      defaultValue={(order as any)?.supplierInHandsDate ? format(new Date((order as any).supplierInHandsDate), "yyyy-MM-dd") : ""}
                      className="h-8 text-sm"
                      disabled={isLocked}
                      onBlur={(e) => {
                        const newVal = e.target.value || null;
                        const oldVal = (order as any)?.supplierInHandsDate ? format(new Date((order as any).supplierInHandsDate), "yyyy-MM-dd") : "";
                        if (newVal !== oldVal) updateFieldMutation.mutate({ supplierInHandsDate: newVal });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Event Date</label>
                    <Input
                      type="date"
                      defaultValue={(order as any)?.eventDate ? format(new Date((order as any).eventDate), "yyyy-MM-dd") : ""}
                      className="h-8 text-sm"
                      disabled={isLocked}
                      onBlur={(e) => {
                        const newVal = e.target.value || null;
                        const oldVal = (order as any)?.eventDate ? format(new Date((order as any).eventDate), "yyyy-MM-dd") : "";
                        if (newVal !== oldVal) updateFieldMutation.mutate({ eventDate: newVal });
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Default Margin</label>
                    <Input
                      defaultValue={Number((order as any)?.margin || 0).toFixed(1)}
                      className="h-8 text-sm"
                      placeholder="%"
                      disabled={isLocked}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Customer PO</label>
                    <Input
                      defaultValue={(order as any)?.customerPo || ""}
                      className="h-8 text-sm"
                      placeholder="PO #"
                      disabled={isLocked}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {(order as any)?.isFirm && (
                    <Badge variant="outline" className="text-xs">Firm Order</Badge>
                  )}
                  {(order as any)?.isRush && (
                    <Badge variant="destructive" className="text-xs">Rush Order</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  isDeleting={isDeleting || isLocked}
                  isRegenerating={isGenerating}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products / Artwork Tabs - CommonSKU style */}
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
