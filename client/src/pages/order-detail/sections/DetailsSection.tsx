import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { useProductionStages } from "@/hooks/useProductionStages";
import type { useOrderDetailData } from "../hooks/useOrderDetailData";
import {
  statusColorMap,
  statusDisplayMap,
} from "../hooks/useOrderDetailData";
import type { Order } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  Factory,
  FileText,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  ShoppingCart,
  ThumbsUp,
  TrendingUp,
  Truck,
  User,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface DetailsSectionProps {
  orderId: string;
  data: ReturnType<typeof useOrderDetailData>;
}

export default function DetailsSection({ orderId, data }: DetailsSectionProps) {
  const {
    order,
    companies,
    contacts,
    invoice,
    invoiceLoading,
    teamMembers,
    orderItems,
    companyName,
    primaryContact,
    companyData,
    assignedUser,
    csrUser,
  } = data;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { stages: productionStages } = useProductionStages();

  // Dialog state
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [isEditBillingAddressOpen, setIsEditBillingAddressOpen] = useState(false);
  const [isEditShippingAddressOpen, setIsEditShippingAddressOpen] = useState(false);
  const [isEditShippingInfoOpen, setIsEditShippingInfoOpen] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [isReassignCsrDialogOpen, setIsReassignCsrDialogOpen] = useState(false);

  // Form state
  const [selectedContactId, setSelectedContactId] = useState("");
  const [reassignUserId, setReassignUserId] = useState("");
  const [reassignCsrUserId, setReassignCsrUserId] = useState("");

  const [billingAddressForm, setBillingAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
    contactName: "",
    email: "",
  });

  const [shippingAddressForm, setShippingAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
    contactName: "",
    email: "",
  });

  const [shippingInfoForm, setShippingInfoForm] = useState({
    supplierInHandsDate: "",
    inHandsDate: "",
    eventDate: "",
    isFirm: false,
    isRush: false,
    shippingMethod: "",
  });

  // ----- Mutations -----

  // Update order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
    }: {
      orderId: string;
      newStatus: string;
    }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/orders/${variables.orderId}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.orderId}/activities`],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/dashboard/recent-orders"],
      });
      toast({ title: "Order status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update order status", variant: "destructive" });
    },
  });

  // Create invoice
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create invoice");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/orders/${orderId}/invoice`],
      });
      toast({
        title: "Invoice Created",
        description: "Invoice has been generated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice.",
        variant: "destructive",
      });
    },
  });

  // Update shipping info
  const updateShippingInfoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update shipping info");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      setIsEditShippingInfoOpen(false);
      toast({ title: "Shipping information updated successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to update shipping information",
        variant: "destructive",
      });
    },
  });

  // Update billing address
  const updateBillingAddressMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingAddress: JSON.stringify(data) }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update billing address");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      setIsEditBillingAddressOpen(false);
      toast({ title: "Billing address updated successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to update billing address",
        variant: "destructive",
      });
    },
  });

  // Update shipping address
  const updateShippingAddressMutation = useMutation({
    mutationFn: async (data: { shippingAddress: string }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update shipping address");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      setIsEditShippingAddressOpen(false);
      toast({ title: "Shipping address updated successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to update shipping address",
        variant: "destructive",
      });
    },
  });

  // Update order contact
  const updateOrderContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update contact");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      setIsEditContactOpen(false);
      toast({ title: "Contact updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update contact", variant: "destructive" });
    },
  });

  // Reassign Sales Rep
  const reassignSalesRepMutation = useMutation({
    mutationFn: async ({
      orderId,
      userId,
    }: {
      orderId: string;
      userId: string;
    }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedUserId: userId }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to reassign sales rep");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/team"] });
      setIsReassignDialogOpen(false);
      setReassignUserId("");
      toast({
        title: "Sales Rep Reassigned",
        description: "Sales rep has been reassigned successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reassign sales rep.",
        variant: "destructive",
      });
    },
  });

  // Reassign CSR
  const reassignCsrMutation = useMutation({
    mutationFn: async ({
      orderId,
      userId,
    }: {
      orderId: string;
      userId: string;
    }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrUserId: userId }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to reassign CSR");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/team"] });
      setIsReassignCsrDialogOpen(false);
      setReassignCsrUserId("");
      toast({
        title: "CSR Reassigned",
        description: "CSR has been reassigned successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reassign CSR.",
        variant: "destructive",
      });
    },
  });

  // ----- Handlers -----

  const handleOpenEditContact = () => {
    setSelectedContactId(order?.contactId || primaryContact?.id || "");
    setIsEditContactOpen(true);
  };

  const handleOpenEditBillingAddress = () => {
    let billing: any = {};
    if ((order as any)?.billingAddress) {
      try {
        billing = JSON.parse((order as any).billingAddress);
      } catch {
        billing = {};
      }
    }

    setBillingAddressForm({
      street: billing.street || "",
      city: billing.city || "",
      state: billing.state || "",
      zipCode: billing.zipCode || "",
      country: billing.country || "US",
      phone: billing.phone || "",
      contactName: billing.contactName || "",
      email: billing.email || "",
    });
    setIsEditBillingAddressOpen(true);
  };

  const handleOpenEditShippingAddress = () => {
    const shippingAddr = (order as any)?.shippingAddress || "";
    try {
      const parsed = JSON.parse(shippingAddr);
      setShippingAddressForm({
        street: parsed.street || parsed.address || "",
        city: parsed.city || "",
        state: parsed.state || "",
        zipCode: parsed.zipCode || "",
        country: parsed.country || "US",
        phone: parsed.phone || "",
        contactName: parsed.contactName || "",
        email: parsed.email || "",
      });
    } catch {
      setShippingAddressForm({
        street: shippingAddr,
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        phone: "",
        contactName: "",
        email: "",
      });
    }
    setIsEditShippingAddressOpen(true);
  };

  const handleOpenEditShippingInfo = () => {
    setShippingInfoForm({
      supplierInHandsDate: (order as any)?.supplierInHandsDate
        ? new Date((order as any).supplierInHandsDate)
            .toISOString()
            .split("T")[0]
        : "",
      inHandsDate: order?.inHandsDate
        ? new Date(order.inHandsDate).toISOString().split("T")[0]
        : "",
      eventDate: order?.eventDate
        ? new Date(order.eventDate).toISOString().split("T")[0]
        : "",
      isFirm: (order as any)?.isFirm || false,
      isRush: (order as any)?.isRush || false,
      shippingMethod: (order as any)?.shippingMethod || "",
    });
    setIsEditShippingInfoOpen(true);
  };

  const handleSaveShippingInfo = () => {
    const data: any = {};
    if (shippingInfoForm.supplierInHandsDate)
      data.supplierInHandsDate = shippingInfoForm.supplierInHandsDate;
    if (shippingInfoForm.inHandsDate)
      data.inHandsDate = shippingInfoForm.inHandsDate;
    if (shippingInfoForm.eventDate) data.eventDate = shippingInfoForm.eventDate;
    data.isFirm = shippingInfoForm.isFirm;
    data.isRush = shippingInfoForm.isRush;
    updateShippingInfoMutation.mutate(data);
  };

  const handleSaveBillingAddress = () => {
    updateBillingAddressMutation.mutate(billingAddressForm);
  };

  const handleSaveShippingAddress = () => {
    const shippingData = JSON.stringify(shippingAddressForm);
    updateShippingAddressMutation.mutate({ shippingAddress: shippingData });
  };

  const handleSaveContact = () => {
    if (selectedContactId) {
      updateOrderContactMutation.mutate(selectedContactId);
    }
  };

  if (!order) return null;

  // Calculate priority from inHandsDate
  const orderPriority =
    order.inHandsDate && new Date(order.inHandsDate) <= addDays(new Date(), 7)
      ? "high"
      : "medium";

  // Check if this is a rush order based on in hands date
  const isRushOrder = order.inHandsDate
    ? new Date(order.inHandsDate).getTime() - new Date().getTime() <
      7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Details */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row justify-between py-2">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Info
            </CardTitle>
            <div className="flex gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Order Type
                </p>
                <Badge variant="outline" className="mt-1">
                  {order.orderType?.replace("_", " ").toUpperCase() ||
                    "QUOTE"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Priority
                </p>
                <Badge
                  variant={
                    orderPriority === "high" ? "default" : "secondary"
                  }
                  className={`mt-1 ${orderPriority === "high"
                      ? "bg-orange-500 text-white"
                      : "bg-yellow-500 text-white"
                    }`}
                >
                  {orderPriority.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-col">
                <Label htmlFor="order-status">Current Status</Label>
                <span className="text-xs text-gray-500 mt-1">
                  Change the order status to track progress
                </span>
              </div>
              <Select
                value={order.status || undefined}
                onValueChange={(value) =>
                  updateStatusMutation.mutate({
                    orderId: order.id,
                    newStatus: value,
                  })
                }
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger id="order-status" className="w-full">
                  <SelectValue>
                    <Badge
                      className={
                        statusColorMap[
                        order.status as keyof typeof statusColorMap
                        ]
                      }
                    >
                      {
                        statusDisplayMap[
                        order.status as keyof typeof statusDisplayMap
                        ]
                      }
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quote">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColorMap.quote}>Quote</Badge>
                      <span className="text-xs text-gray-500">
                        Initial proposal
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pending_approval">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColorMap.pending_approval}>
                        Pending Approval
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Awaiting approval
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColorMap.approved}>
                        Approved
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Ready to start
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="in_production">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColorMap.in_production}>
                        In Production
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Being manufactured
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="shipped">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColorMap.shipped}>
                        Shipped
                      </Badge>
                      <span className="text-xs text-gray-500">
                        In transit
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColorMap.delivered}>
                        Delivered
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Completed
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColorMap.cancelled}>
                        Cancelled
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Order cancelled
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Notes & Special Instructions */}
            {order.notes && (
              <div className="md:col-span-2 flex flex-col gap-2">
                <p className="font-semibold">Order Description</p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {order.notes}
                  </p>
                </div>
              </div>
            )}
            {(order as any).supplierNotes && (
              <div className="flex flex-col gap-2">
                <p className="font-semibold">Supplier Notes</p>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <p className="text-sm text-orange-800 whitespace-pre-line">
                    {(order as any).supplierNotes}
                  </p>
                </div>
              </div>
            )}
            {(order as any).additionalInformation && (
              <div className="flex flex-col gap-2">
                <p className="font-semibold">Additional Information</p>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 whitespace-pre-line">
                    {(order as any).additionalInformation}
                  </p>
                </div>
              </div>
            )}

            {/* Invoice Information */}
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Invoice Status
                </h3>
              </div>

              {invoiceLoading ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Loading invoice...
                  </p>
                </div>
              ) : invoice ? (
                <div
                  className={`border-l-4 rounded-lg p-4 ${invoice.status === "paid" ? "border-l-green-500 bg-green-50" : "border-l-orange-500 bg-orange-50"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Invoice #{invoice.invoiceNumber}
                      </span>
                      <Badge
                        variant={
                          invoice.status === "paid"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </div>
                    {invoice.stripeInvoiceUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={invoice.stripeInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Invoice
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="space-y-1 mb-2">
                    {/* Subtotal */}
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        ${Number(invoice.subtotal).toLocaleString()}
                      </span>
                    </div>

                    {/* Shipping */}
                    {Number(order?.shipping) > 0 && (
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium text-gray-900">
                          ${Number(order.shipping).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Tax */}
                    {invoice.taxAmount && Number(invoice.taxAmount) > 0 && (
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium text-gray-900">
                          ${Number(invoice.taxAmount).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Total with separator */}
                    <div className="pt-2 border-t border-gray-300">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          Total Amount
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          ${Number(invoice.totalAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {invoice.dueDate && invoice.status === "pending" && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due Date
                      </span>
                      <span className="font-medium text-orange-600">
                        {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                  {invoice.paidAt && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-700">
                      <CheckCircle className="w-3 h-3" />
                      <span>
                        Paid on{" "}
                        {format(new Date(invoice.paidAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  {orderItems.length > 0 && (
                    <div className="space-y-3">
                      {/* Price Breakdown */}
                      <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">
                            ${Number(order.subtotal || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax:</span>
                          <span className="font-medium">
                            ${Number(order.tax || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="font-medium">
                            ${Number(order.shipping || 0).toLocaleString()}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold">Total:</span>
                          </div>
                          <span className="text-lg font-bold text-green-600">
                            ${Number(order.total || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          Deposit (50%):{" "}
                        </span>
                        <span className="text-sm font-semibold">
                          ${(Number(order.total || 0) * 0.5).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        No Invoice Generated
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Create an invoice to enable payment processing
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => createInvoiceMutation.mutate()}
                      disabled={
                        order?.status !== "approved" ||
                        createInvoiceMutation.isPending
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {createInvoiceMutation.isPending
                        ? "Creating..."
                        : "Generate Invoice"}
                    </Button>
                  </div>
                  {order?.status !== "approved" && (
                    <p className="text-xs text-orange-600 mt-2">
                      Order must be approved first
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company & Contact Information */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Order Details
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xl font-semibold">Account Info</h5>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditContact}
                  className="ml-auto"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <UserAvatar name={companyName} size="sm" />
                <div>
                  <p className="font-semibold">{companyName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Contact Name:</p>
                <span className="text-sm">
                  {primaryContact
                    ? `${primaryContact.firstName} ${primaryContact.lastName}${primaryContact.title ? ` - ${primaryContact.title}` : ""}`
                    : "No primary contact"}
                </span>
              </div>

              {primaryContact?.email && (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Contact Email:</p>
                  <span className="text-sm">{primaryContact.email}</span>
                </div>
              )}

              {primaryContact?.phone && (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Contact Phone:</p>
                  <span className="text-sm">{primaryContact.phone}</span>
                </div>
              )}
              <h5 className=" font-semibold">Attention To:</h5>
              <div className="pl-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Sales Rep:</p>
                    <UserAvatar user={assignedUser} size="sm" />
                    <span className="text-sm">
                      {assignedUser
                        ? `${assignedUser.firstName} ${assignedUser.lastName}`
                        : "Unassigned"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setReassignUserId(
                        (order as any)?.assignedUserId || "",
                      );
                      setIsReassignDialogOpen(true);
                    }}
                  >
                    <User className="w-3 h-3 mr-1" />
                    {assignedUser ? "Reassign" : "Assign"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">CSR:</p>
                    <UserAvatar user={csrUser} size="sm" />
                    <span className="text-sm">
                      {csrUser
                        ? `${csrUser.firstName} ${csrUser.lastName}`
                        : "Unassigned"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setReassignCsrUserId((order as any)?.csrUserId || "");
                      setIsReassignCsrDialogOpen(true);
                    }}
                  >
                    <User className="w-3 h-3 mr-1" />
                    {csrUser ? "Reassign" : "Assign"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Billing Address</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditBillingAddress}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Billing Contact:</p>
                <p className="text-sm">
                  {(() => {
                    try {
                      if ((order as any).billingAddress) {
                        const parsed = JSON.parse(
                          (order as any).billingAddress,
                        );
                        return parsed.contactName || "Not specified";
                      }
                      return "Not specified";
                    } catch {
                      return "Not specified";
                    }
                  })()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  Billing Customer Email:
                </p>
                <p className="text-sm">
                  {(() => {
                    try {
                      if ((order as any).billingAddress) {
                        const parsed = JSON.parse(
                          (order as any).billingAddress,
                        );
                        return parsed.email || "Not specified";
                      }
                      return "Not specified";
                    } catch {
                      return "Not specified";
                    }
                  })()}
                </p>
              </div>

              <div className="flex items-start gap-2 w-full">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="text-sm w-full">
                  {(order as any).billingAddress ? (
                    <>
                      {(() => {
                        try {
                          const parsed = JSON.parse(
                            (order as any).billingAddress,
                          );
                          return (
                            <>
                              {parsed.street && (
                                <p className="text-gray-600">
                                  {parsed.street}
                                </p>
                              )}
                              {parsed.city && (
                                <p className="text-gray-600">
                                  {parsed.city}
                                  {parsed.state && `, ${parsed.state}`}
                                  {parsed.zipCode && ` ${parsed.zipCode}`}
                                </p>
                              )}
                              {parsed.country && (
                                <p className="text-gray-600">
                                  {parsed.country}
                                </p>
                              )}
                              {parsed.phone && (
                                <p className="text-gray-600 mt-1">
                                  <span className="font-medium">
                                    Phone:
                                  </span>{" "}
                                  {parsed.phone}
                                </p>
                              )}
                            </>
                          );
                        } catch {
                          return (
                            <p className="text-gray-600">
                              {(order as any).billingAddress}
                            </p>
                          );
                        }
                      })()}
                    </>
                  ) : companyData?.billingAddress ? (
                    <>
                      {companyData.billingAddress.street && (
                        <p className="text-gray-600">
                          {companyData.billingAddress.street}
                        </p>
                      )}
                      {companyData.billingAddress.city && (
                        <p className="text-gray-600">
                          {companyData.billingAddress.city}
                          {companyData.billingAddress.state &&
                            `, ${companyData.billingAddress.state}`}
                          {companyData.billingAddress.zipCode &&
                            ` ${companyData.billingAddress.zipCode}`}
                        </p>
                      )}
                      {companyData.billingAddress.country && (
                        <p className="text-gray-600">
                          {companyData.billingAddress.country}
                        </p>
                      )}
                    </>
                  ) : companyData?.address ? (
                    <>
                      <p className="text-gray-600">{companyData.address}</p>
                      {(companyData.city ||
                        companyData.state ||
                        companyData.zipCode) && (
                          <p className="text-gray-600">
                            {companyData.city}
                            {companyData.state && `, ${companyData.state}`}
                            {companyData.zipCode && ` ${companyData.zipCode}`}
                          </p>
                        )}
                      {companyData.country && (
                        <p className="text-gray-600">
                          {companyData.country}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 italic">
                      No billing address on file
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Shipping Address</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditShippingAddress}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Shipping Contact:</p>
                <p className="text-sm">
                  {(() => {
                    try {
                      if ((order as any).shippingAddress) {
                        const parsed = JSON.parse(
                          (order as any).shippingAddress,
                        );
                        return parsed.contactName || "Not specified";
                      }
                      return "Not specified";
                    } catch {
                      return "Not specified";
                    }
                  })()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  Shipping Customer Email:
                </p>
                <p className="text-sm">
                  {(() => {
                    try {
                      if ((order as any).shippingAddress) {
                        const parsed = JSON.parse(
                          (order as any).shippingAddress,
                        );
                        return parsed.email || "Not specified";
                      }
                      return "Not specified";
                    } catch {
                      return "Not specified";
                    }
                  })()}
                </p>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="text-sm">
                  {(order as any).shippingAddress ? (
                    <>
                      {(() => {
                        try {
                          const parsed = JSON.parse(
                            (order as any).shippingAddress,
                          );
                          return (
                            <>
                              {parsed.street && (
                                <p className="text-gray-600">
                                  {parsed.street}
                                </p>
                              )}
                              {parsed.city && (
                                <p className="text-gray-600">
                                  {parsed.city}
                                  {parsed.state && `, ${parsed.state}`}
                                  {parsed.zipCode && ` ${parsed.zipCode}`}
                                </p>
                              )}
                              {parsed.country && (
                                <p className="text-gray-600">
                                  {parsed.country}
                                </p>
                              )}
                              {parsed.phone && (
                                <p className="text-gray-600 mt-1">
                                  <span className="font-medium">
                                    Phone:
                                  </span>{" "}
                                  {parsed.phone}
                                </p>
                              )}
                            </>
                          );
                        } catch {
                          return (
                            <p className="text-gray-600 whitespace-pre-line">
                              {(order as any).shippingAddress}
                            </p>
                          );
                        }
                      })()}
                    </>
                  ) : companyData?.shippingAddresses &&
                    Array.isArray(companyData.shippingAddresses) &&
                    companyData.shippingAddresses.length > 0 ? (
                    <>
                      {companyData.shippingAddresses[0].street && (
                        <p className="text-gray-600">
                          {companyData.shippingAddresses[0].street}
                        </p>
                      )}
                      {companyData.shippingAddresses[0].city && (
                        <p className="text-gray-600">
                          {companyData.shippingAddresses[0].city}
                          {companyData.shippingAddresses[0].state &&
                            `, ${companyData.shippingAddresses[0].state}`}
                          {companyData.shippingAddresses[0].zipCode &&
                            ` ${companyData.shippingAddresses[0].zipCode}`}
                        </p>
                      )}
                      {companyData.shippingAddresses[0].country && (
                        <p className="text-gray-600">
                          {companyData.shippingAddresses[0].country}
                        </p>
                      )}
                      {companyData.shippingAddresses.length > 1 && (
                        <p className="text-xs text-blue-600 mt-1">
                          +{companyData.shippingAddresses.length - 1} more
                          shipping address(es) on file
                        </p>
                      )}
                    </>
                  ) : companyData?.address ? (
                    <>
                      <p className="text-gray-600">{companyData.address}</p>
                      {(companyData.city ||
                        companyData.state ||
                        companyData.zipCode) && (
                          <p className="text-gray-600">
                            {companyData.city}
                            {companyData.state && `, ${companyData.state}`}
                            {companyData.zipCode && ` ${companyData.zipCode}`}
                          </p>
                        )}
                      {companyData.country && (
                        <p className="text-gray-600">
                          {companyData.country}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 italic">
                      No shipping address provided
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping & Timeline Information
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEditShippingInfo}
                className="ml-auto"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Information */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700">
                Important Dates
              </h4>

              {(order as any).supplierInHandsDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Supplier In-Hands Date:
                  </span>
                  <span className="text-sm font-semibold text-blue-700">
                    {format(
                      new Date((order as any).supplierInHandsDate),
                      "MMM dd, yyyy",
                    )}
                  </span>
                </div>
              )}

              {order.inHandsDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    Customer Requested In-Hands Date:
                  </span>
                  <span
                    className={`text-sm font-semibold ${isRushOrder ? "text-red-600" : "text-gray-900"}`}
                  >
                    {format(new Date(order.inHandsDate), "MMM dd, yyyy")}
                  </span>
                  {(order as any).isFirm && (
                    <Badge variant="destructive" className="text-xs">
                      FIRM
                    </Badge>
                  )}
                  {(order as any).isRush && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-red-50 text-red-700 border-red-300"
                    >
                      RUSH
                    </Badge>
                  )}
                  {isRushOrder && (
                    <Badge
                      variant="outline"
                      className="text-xs text-red-600 border-red-200"
                    >
                      {Math.ceil(
                        (new Date(order.inHandsDate).getTime() -
                          new Date().getTime()) /
                        (24 * 60 * 60 * 1000),
                      )}{" "}
                      days left
                    </Badge>
                  )}
                </div>
              )}

              {order.eventDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">
                    Customer Event Date:
                  </span>
                  <span className="text-sm font-semibold text-purple-700">
                    {format(new Date(order.eventDate), "MMM dd, yyyy")}
                  </span>
                </div>
              )}

              {order.createdAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">
                    Order Created:
                  </span>
                  <span className="text-sm text-gray-600">
                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span className="text-gray-600">Last updated</span>
                  <span className="text-gray-400">
                    • {new Date(order.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {isRushOrder && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Rush Order Alert
                  </span>
                </div>
                <p className="text-xs text-red-700">
                  This order has a tight deadline. Coordinate with vendors
                  for expedited production.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Production Stages Progress */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="w-5 h-5" />
              Production Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Stage Highlight */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Factory className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Current Stage
                      </p>
                      <p className="text-xs text-blue-700">
                        {productionStages.find(
                          (s) => s.id === (order as any).currentStage,
                        )?.name ||
                          (order as any).currentStage
                            ?.replace(/-/g, " ")
                            .replace(/\b\w/g, (l: string) =>
                              l.toUpperCase(),
                            ) ||
                          "Sales Booked"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    {(order as any).stagesCompleted?.length || 1} /{" "}
                    {productionStages.length} Complete
                  </Badge>
                </div>
              </div>

              {/* Stages Timeline */}
              <div className="space-y-2">
                {productionStages.map((stage) => {
                  const iconMap: Record<string, any> = {
                    ShoppingCart,
                    FileText,
                    MessageSquare,
                    Eye,
                    ThumbsUp,
                    Package,
                    CreditCard,
                    Truck,
                    MapPin,
                    CheckCircle,
                    Factory,
                    Clock,
                    Calendar,
                  };
                  const Icon = iconMap[stage.icon] || Package;
                  const isCompleted = (
                    (order as any).stagesCompleted || ["sales-booked"]
                  ).includes(stage.id);
                  const isCurrent =
                    (order as any).currentStage === stage.id &&
                    !isCompleted;

                  return (
                    <div key={stage.id} className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${isCompleted
                            ? "bg-green-100 border-green-500"
                            : isCurrent
                              ? "bg-blue-100 border-blue-500"
                              : "bg-gray-100 border-gray-300"
                          }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Icon
                            className={`w-4 h-4 ${isCurrent ? "text-blue-600" : "text-gray-400"}`}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${isCompleted
                              ? "text-green-700"
                              : isCurrent
                                ? "text-blue-700"
                                : "text-gray-600"
                            }`}
                        >
                          {stage.name}
                        </p>
                      </div>
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                        >
                          In Progress
                        </Badge>
                      )}
                      {isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Next Actions */}
              {(order as any).stageData?.nextActionDate && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        Next Action
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Due:{" "}
                        {new Date(
                          (order as any).stageData.nextActionDate,
                        ).toLocaleDateString()}
                      </p>
                      {(order as any).customNotes?.nextAction && (
                        <p className="text-xs text-amber-600 mt-1">
                          {(order as any).customNotes.nextAction}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditContactOpen} onOpenChange={setIsEditContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Primary Contact</DialogTitle>
            <DialogDescription>
              Select the primary contact for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={selectedContactId}
              onValueChange={setSelectedContactId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact: any) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        name={`${contact.firstName} ${contact.lastName}`}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{contact.email}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditContactOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveContact}
              disabled={updateOrderContactMutation.isPending}
              className="flex-1"
            >
              {updateOrderContactMutation.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Billing Address Dialog */}
      <Dialog
        open={isEditBillingAddressOpen}
        onOpenChange={setIsEditBillingAddressOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Billing Address</DialogTitle>
            <DialogDescription>
              Update the billing address for {companyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="billing-street">Street Address</Label>
              <Input
                id="billing-street"
                value={billingAddressForm.street}
                onChange={(e) =>
                  setBillingAddressForm({
                    ...billingAddressForm,
                    street: e.target.value,
                  })
                }
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="billing-city">City</Label>
                <Input
                  id="billing-city"
                  value={billingAddressForm.city}
                  onChange={(e) =>
                    setBillingAddressForm({
                      ...billingAddressForm,
                      city: e.target.value,
                    })
                  }
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="billing-state">State</Label>
                <Input
                  id="billing-state"
                  value={billingAddressForm.state}
                  onChange={(e) =>
                    setBillingAddressForm({
                      ...billingAddressForm,
                      state: e.target.value,
                    })
                  }
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="billing-zip">ZIP Code</Label>
                <Input
                  id="billing-zip"
                  value={billingAddressForm.zipCode}
                  onChange={(e) =>
                    setBillingAddressForm({
                      ...billingAddressForm,
                      zipCode: e.target.value,
                    })
                  }
                  placeholder="12345"
                />
              </div>
              <div>
                <Label htmlFor="billing-country">Country</Label>
                <Input
                  id="billing-country"
                  value={billingAddressForm.country}
                  onChange={(e) =>
                    setBillingAddressForm({
                      ...billingAddressForm,
                      country: e.target.value,
                    })
                  }
                  placeholder="US"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="billing-phone">Phone</Label>
              <Input
                id="billing-phone"
                type="tel"
                value={billingAddressForm.phone}
                onChange={(e) =>
                  setBillingAddressForm({
                    ...billingAddressForm,
                    phone: e.target.value,
                  })
                }
                placeholder="(555) 123-4567"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="billing-contact">Contact Name</Label>
                <Input
                  id="billing-contact"
                  value={billingAddressForm.contactName}
                  onChange={(e) =>
                    setBillingAddressForm({
                      ...billingAddressForm,
                      contactName: e.target.value,
                    })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="billing-email">Email</Label>
                <Input
                  id="billing-email"
                  type="email"
                  value={billingAddressForm.email}
                  onChange={(e) =>
                    setBillingAddressForm({
                      ...billingAddressForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="billing@company.com"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditBillingAddressOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBillingAddress}
              disabled={updateBillingAddressMutation.isPending}
              className="flex-1"
            >
              {updateBillingAddressMutation.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Shipping Address Dialog */}
      <Dialog
        open={isEditShippingAddressOpen}
        onOpenChange={setIsEditShippingAddressOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Shipping Address</DialogTitle>
            <DialogDescription>
              Update the shipping address for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (order?.billingAddress) {
                    try {
                      const billing = JSON.parse(order.billingAddress);
                      setShippingAddressForm({
                        street: billing.street || "",
                        city: billing.city || "",
                        state: billing.state || "",
                        zipCode: billing.zipCode || "",
                        country: billing.country || "US",
                        phone: billing.phone || "",
                        contactName: billing.contactName || "",
                        email: billing.email || "",
                      });
                    } catch {
                      toast({
                        title: "Error",
                        description: "Could not copy billing address",
                        variant: "destructive",
                      });
                    }
                  }
                }}
              >
                Copy from Billing Address
              </Button>
            </div>

            <div>
              <Label htmlFor="shipping-street">Street Address</Label>
              <Input
                id="shipping-street"
                value={shippingAddressForm.street}
                onChange={(e) =>
                  setShippingAddressForm({
                    ...shippingAddressForm,
                    street: e.target.value,
                  })
                }
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="shipping-city">City</Label>
                <Input
                  id="shipping-city"
                  value={shippingAddressForm.city}
                  onChange={(e) =>
                    setShippingAddressForm({
                      ...shippingAddressForm,
                      city: e.target.value,
                    })
                  }
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="shipping-state">State</Label>
                <Input
                  id="shipping-state"
                  value={shippingAddressForm.state}
                  onChange={(e) =>
                    setShippingAddressForm({
                      ...shippingAddressForm,
                      state: e.target.value,
                    })
                  }
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="shipping-zip">ZIP Code</Label>
                <Input
                  id="shipping-zip"
                  value={shippingAddressForm.zipCode}
                  onChange={(e) =>
                    setShippingAddressForm({
                      ...shippingAddressForm,
                      zipCode: e.target.value,
                    })
                  }
                  placeholder="12345"
                />
              </div>
              <div>
                <Label htmlFor="shipping-country">Country</Label>
                <Input
                  id="shipping-country"
                  value={shippingAddressForm.country}
                  onChange={(e) =>
                    setShippingAddressForm({
                      ...shippingAddressForm,
                      country: e.target.value,
                    })
                  }
                  placeholder="US"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="shipping-phone">Phone</Label>
              <Input
                id="shipping-phone"
                type="tel"
                value={shippingAddressForm.phone}
                onChange={(e) =>
                  setShippingAddressForm({
                    ...shippingAddressForm,
                    phone: e.target.value,
                  })
                }
                placeholder="(555) 123-4567"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="shipping-contact">Contact Name</Label>
                <Input
                  id="shipping-contact"
                  value={shippingAddressForm.contactName}
                  onChange={(e) =>
                    setShippingAddressForm({
                      ...shippingAddressForm,
                      contactName: e.target.value,
                    })
                  }
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <Label htmlFor="shipping-email">Contact Email</Label>
                <Input
                  id="shipping-email"
                  type="email"
                  value={shippingAddressForm.email}
                  onChange={(e) =>
                    setShippingAddressForm({
                      ...shippingAddressForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="shipping@company.com"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditShippingAddressOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveShippingAddress}
              disabled={updateShippingAddressMutation.isPending}
              className="flex-1"
            >
              {updateShippingAddressMutation.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Shipping Info Dialog */}
      <Dialog
        open={isEditShippingInfoOpen}
        onOpenChange={setIsEditShippingInfoOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Shipping & Timeline Information</DialogTitle>
            <DialogDescription>
              Update shipping details and important dates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier-in-hands">
                  Supplier In-Hands Date
                </Label>
                <Input
                  id="supplier-in-hands"
                  type="date"
                  value={shippingInfoForm.supplierInHandsDate}
                  onChange={(e) =>
                    setShippingInfoForm({
                      ...shippingInfoForm,
                      supplierInHandsDate: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="customer-in-hands">
                  Customer In-Hands Date
                </Label>
                <Input
                  id="customer-in-hands"
                  type="date"
                  value={shippingInfoForm.inHandsDate}
                  onChange={(e) =>
                    setShippingInfoForm({
                      ...shippingInfoForm,
                      inHandsDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-date">Event Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={shippingInfoForm.eventDate}
                  onChange={(e) =>
                    setShippingInfoForm({
                      ...shippingInfoForm,
                      eventDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-6 pt-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-firm"
                    checked={shippingInfoForm.isFirm}
                    onChange={(e) =>
                      setShippingInfoForm({
                        ...shippingInfoForm,
                        isFirm: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="is-firm">Firm In-Hands Date</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-rush"
                    checked={shippingInfoForm.isRush}
                    onChange={(e) =>
                      setShippingInfoForm({
                        ...shippingInfoForm,
                        isRush: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="is-rush" className="text-red-600 font-medium">
                    Rush Order
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditShippingInfoOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveShippingInfo}
              disabled={updateShippingInfoMutation.isPending}
              className="flex-1"
            >
              {updateShippingInfoMutation.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign Sales Rep Dialog */}
      <Dialog
        open={isReassignDialogOpen}
        onOpenChange={setIsReassignDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Sales Rep</DialogTitle>
            <DialogDescription>
              Select a team member to assign as the sales representative for
              this order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reassign-user">Team Member</Label>
              <Select value={reassignUserId} onValueChange={setReassignUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Unassign (No one)</span>
                    </div>
                  </SelectItem>
                  {teamMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={member} size="sm" />
                        <div>
                          <div className="font-medium">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {assignedUser && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">
                  Currently Assigned To:
                </p>
                <div className="flex items-center gap-2">
                  <UserAvatar user={assignedUser} size="sm" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      {assignedUser.firstName} {assignedUser.lastName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReassignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (orderId) {
                    reassignSalesRepMutation.mutate({
                      orderId,
                      userId:
                        reassignUserId === "unassigned" ? "" : reassignUserId,
                    });
                  }
                }}
                disabled={!reassignUserId || reassignSalesRepMutation.isPending}
              >
                {reassignSalesRepMutation.isPending
                  ? "Reassigning..."
                  : "Reassign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign CSR Dialog */}
      <Dialog
        open={isReassignCsrDialogOpen}
        onOpenChange={setIsReassignCsrDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign CSR</DialogTitle>
            <DialogDescription>
              Select a team member to assign as the customer service
              representative for this order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reassign-csr-user">Team Member</Label>
              <Select
                value={reassignCsrUserId}
                onValueChange={setReassignCsrUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Unassign (No one)</span>
                    </div>
                  </SelectItem>
                  {teamMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={member} size="sm" />
                        <div>
                          <div className="font-medium">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {csrUser && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">
                  Currently Assigned CSR:
                </p>
                <div className="flex items-center gap-2">
                  <UserAvatar user={csrUser} size="sm" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      {csrUser.firstName} {csrUser.lastName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReassignCsrDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (orderId) {
                    reassignCsrMutation.mutate({
                      orderId,
                      userId:
                        reassignCsrUserId === "unassigned"
                          ? ""
                          : reassignCsrUserId,
                    });
                  }
                }}
                disabled={!reassignCsrUserId || reassignCsrMutation.isPending}
              >
                {reassignCsrMutation.isPending ? "Reassigning..." : "Reassign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
