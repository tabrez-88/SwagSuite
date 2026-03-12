import { useState, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Package,
  Palette,
  Plus,
  Send,
  Trash2,
  Wrench,
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

      {/* Products / Services / Artwork Tabs - CommonSKU style */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products" className="gap-1">
            <Package className="w-4 h-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1">
            <Wrench className="w-4 h-4" />
            Services
            {data.serviceCharges.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{data.serviceCharges.length}</Badge>
            )}
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

        {/* Services Tab */}
        <TabsContent value="services" className="mt-4">
          <ServiceChargesTab orderId={orderId} data={data} isLocked={isLocked} />
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

// ── Service Charges Sub-component (CommonSKU-style order-level services) ──────

const SERVICE_CHARGE_TYPES = [
  { value: "freight", label: "Freight" },
  { value: "fulfillment", label: "Fulfillment" },
  { value: "shipping", label: "Shipping" },
  { value: "rush_fee", label: "Rush Fee" },
  { value: "other", label: "Other Service" },
  { value: "custom", label: "Custom Service" },
];

function ServiceChargesTab({ orderId, data, isLocked }: { orderId: string; data: ReturnType<typeof useProjectData>; isLocked: boolean }) {
  const { serviceCharges, suppliers } = data;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCharge, setEditingCharge] = useState<any>(null);

  // Form state
  const [formType, setFormType] = useState("freight");
  const [formDesc, setFormDesc] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [formCost, setFormCost] = useState("0");
  const [formPrice, setFormPrice] = useState("0");
  const [formTaxable, setFormTaxable] = useState(false);
  const [formMargin, setFormMargin] = useState(false);
  const [formDisplay, setFormDisplay] = useState(true);
  const [formVendor, setFormVendor] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const resetForm = () => {
    setFormType("freight"); setFormDesc(""); setFormQty("1");
    setFormCost("0"); setFormPrice("0"); setFormTaxable(false);
    setFormMargin(false); setFormDisplay(true); setFormVendor(""); setFormNotes("");
  };

  const openAdd = () => { resetForm(); setEditingCharge(null); setShowAddDialog(true); };

  const openEdit = (charge: any) => {
    setFormType(charge.chargeType || "other");
    setFormDesc(charge.description || "");
    setFormQty(String(charge.quantity || 1));
    setFormCost(String(charge.unitCost || "0"));
    setFormPrice(String(charge.unitPrice || "0"));
    setFormTaxable(!!charge.taxable);
    setFormMargin(!!charge.includeInMargin);
    setFormDisplay(charge.displayToClient !== false);
    setFormVendor(charge.vendorId || "");
    setFormNotes(charge.notes || "");
    setEditingCharge(charge);
    setShowAddDialog(true);
  };

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`/api/orders/${orderId}/service-charges`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/service-charges`] });
      toast({ title: "Service charge added" });
      setShowAddDialog(false);
    },
    onError: () => toast({ title: "Failed to add service charge", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) => {
      const res = await fetch(`/api/orders/${orderId}/service-charges/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/service-charges`] });
      toast({ title: "Service charge updated" });
      setShowAddDialog(false);
    },
    onError: () => toast({ title: "Failed to update service charge", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${orderId}/service-charges/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/service-charges`] });
      toast({ title: "Service charge removed" });
    },
    onError: () => toast({ title: "Failed to delete service charge", variant: "destructive" }),
  });

  const handleSave = () => {
    const body = {
      chargeType: formType,
      description: formDesc || SERVICE_CHARGE_TYPES.find(t => t.value === formType)?.label || formType,
      quantity: parseInt(formQty) || 1,
      unitCost: formCost || "0",
      unitPrice: formPrice || "0",
      taxable: formTaxable,
      includeInMargin: formMargin,
      displayToClient: formDisplay,
      vendorId: formVendor || null,
      notes: formNotes || null,
    };
    if (editingCharge) {
      updateMutation.mutate({ id: editingCharge.id, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const totalCost = serviceCharges.reduce((sum: number, c: any) => sum + (c.quantity || 1) * parseFloat(c.unitCost || "0"), 0);
  const totalPrice = serviceCharges.reduce((sum: number, c: any) => sum + (c.quantity || 1) * parseFloat(c.unitPrice || "0"), 0);
  const totalMargin = totalPrice - totalCost;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Service Charges</h3>
          <Badge variant="secondary" className="text-[10px]">
            {serviceCharges.length} charge{serviceCharges.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        {!isLocked && (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={openAdd}>
            <Plus className="w-3 h-3" /> Add Service
          </Button>
        )}
      </div>

      {/* Charges list */}
      {serviceCharges.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-1">No service charges</p>
            <p className="text-gray-400 text-xs">Add freight, fulfillment, rush fees, or other service charges</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-xs">Type</th>
                  <th className="text-left p-3 font-medium text-xs">Description</th>
                  <th className="text-center p-3 font-medium text-xs">Qty</th>
                  <th className="text-right p-3 font-medium text-xs">Cost</th>
                  <th className="text-right p-3 font-medium text-xs">Price</th>
                  <th className="text-right p-3 font-medium text-xs">Total</th>
                  <th className="p-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {serviceCharges.map((charge: any) => {
                  const typeInfo = SERVICE_CHARGE_TYPES.find(t => t.value === charge.chargeType);
                  const qty = charge.quantity || 1;
                  const cost = parseFloat(charge.unitCost || "0");
                  const price = parseFloat(charge.unitPrice || "0");
                  const lineTotal = qty * price;

                  return (
                    <tr key={charge.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {typeInfo?.label || charge.chargeType}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs">
                        <span className="font-medium">{charge.description}</span>
                        {!charge.displayToClient && (
                          <Badge variant="outline" className="ml-1.5 text-[9px] text-gray-400">Hidden</Badge>
                        )}
                        {charge.taxable && (
                          <Badge variant="outline" className="ml-1.5 text-[9px] text-gray-400">Taxable</Badge>
                        )}
                      </td>
                      <td className="p-3 text-xs text-center">{qty}</td>
                      <td className="p-3 text-xs text-right text-gray-500">${cost.toFixed(2)}</td>
                      <td className="p-3 text-xs text-right">${price.toFixed(2)}</td>
                      <td className="p-3 text-xs text-right font-medium">${lineTotal.toFixed(2)}</td>
                      <td className="p-3">
                        {!isLocked && (
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEdit(charge)}>
                              <FileText className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => deleteMutation.mutate(charge.id)} disabled={deleteMutation.isPending}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-6">
                  <div>
                    <span className="text-xs text-gray-500">Total Cost</span>
                    <p className="font-medium text-gray-600">${totalCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Total Price</span>
                    <p className="font-semibold">${totalPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Margin</span>
                    <p className={`font-medium ${totalMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${totalMargin.toFixed(2)}
                      {totalPrice > 0 && (
                        <span className="text-[10px] text-gray-400 ml-1">
                          ({((totalMargin / totalPrice) * 100).toFixed(0)}%)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {editingCharge ? "Edit Service Charge" : "Add Service Charge"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
                <Select value={formType} onValueChange={(val) => {
                  setFormType(val);
                  if (!formDesc) setFormDesc(SERVICE_CHARGE_TYPES.find(t => t.value === val)?.label || "");
                }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_CHARGE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="e.g., Freight to client" className="h-9" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Quantity</label>
                <Input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)} className="h-9" min="1" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Unit Cost (our cost)</label>
                <Input type="number" step="0.01" value={formCost} onChange={(e) => setFormCost(e.target.value)} className="h-9" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Unit Price (client)</label>
                <Input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="h-9" />
              </div>
            </div>

            {suppliers && suppliers.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Vendor (optional)</label>
                <Select value={formVendor} onValueChange={setFormVendor}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="No vendor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {suppliers.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Notes</label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="min-h-[60px] resize-none text-sm" placeholder="Internal notes..." />
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={formDisplay} onCheckedChange={(v) => setFormDisplay(!!v)} />
                Show to client
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={formTaxable} onCheckedChange={(v) => setFormTaxable(!!v)} />
                Taxable
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={formMargin} onCheckedChange={(v) => setFormMargin(!!v)} />
                Include in margin calc
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editingCharge ? "Update" : "Add"} Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
