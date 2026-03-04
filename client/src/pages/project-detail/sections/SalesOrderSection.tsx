import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  CreditCard,
  MapPin,
  Package,
  Palette,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { useProjectData } from "../hooks/useProjectData";

// Import the existing ProductsSection for the items table
import ProductsSection from "@/pages/order-detail/sections/ProductsSection";

interface SalesOrderSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
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

export default function SalesOrderSection({ orderId, data }: SalesOrderSectionProps) {
  const { order, companyName, primaryContact, contacts } = data;
  const [, setLocation] = useLocation();
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const contactEmail = primaryContact?.email || "";

  return (
    <div className="space-y-6">
      {/* Sales Order Header - CommonSKU style */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Status */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <Select value={currentStatus} onValueChange={(val) => updateStatusMutation.mutate(val)}>
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
                    <Select defaultValue={(order as any)?.paymentTerms || "net_30"}>
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
                    <Select defaultValue="USD">
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
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Default Margin</label>
                    <Input
                      defaultValue={Number((order as any)?.margin || 0).toFixed(1)}
                      className="h-8 text-sm"
                      placeholder="%"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Customer PO</label>
                    <Input
                      defaultValue={(order as any)?.customerPo || ""}
                      className="h-8 text-sm"
                      placeholder="PO #"
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

      {/* Products / Artwork Tabs - CommonSKU style */}
      <Tabs defaultValue="products" className="w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
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

          {/* View Controls */}
          <div className="flex border rounded-md overflow-hidden">
            <Button variant="ghost" size="sm" className="rounded-none px-3 h-8">
              Compact
            </Button>
            <Button variant="default" size="sm" className="rounded-none px-3 h-8">
              Detailed
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-4">
          <Button
            onClick={() => {
              const isProjectContext = window.location.pathname.startsWith("/project/");
              if (isProjectContext) {
                setLocation(`/project/${orderId}/sales-order/add`);
              } else {
                setLocation(`/orders/${orderId}/products/add`);
              }
            }}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 gap-1"
          >
            <Plus className="w-4 h-4" />
            Product From Database
          </Button>
        </div>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          <ProductsSection orderId={orderId} data={data as any} />
        </TabsContent>

        {/* Artwork Tab */}
        <TabsContent value="artwork" className="mt-4">
          <SalesOrderArtwork orderId={orderId} data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Artwork sub-component for sales order
function SalesOrderArtwork({ orderId, data }: { orderId: string; data: ReturnType<typeof useProjectData> }) {
  const { allArtworkItems, orderItems } = data;

  const artworks: any[] = [];
  if (allArtworkItems && typeof allArtworkItems === "object") {
    Object.entries(allArtworkItems).forEach(([itemId, arts]: [string, any[]]) => {
      const item = orderItems.find((i: any) => i.id === itemId);
      arts.forEach((art: any) => {
        artworks.push({
          ...art,
          productName: item?.productName || "Unknown Product",
        });
      });
    });
  }

  if (artworks.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Palette className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No artwork files</h3>
          <p className="text-gray-500">Artwork files will appear here when uploaded to order items</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {artworks.map((art: any) => (
        <Card key={art.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
            {art.fileUrl || art.filePath ? (
              <img
                src={art.fileUrl || art.filePath}
                alt={art.fileName || "Artwork"}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <Palette className="w-12 h-12 text-gray-200" />
            )}
          </div>
          <CardContent className="p-3">
            <p className="text-sm font-medium truncate">{art.fileName || "Artwork"}</p>
            <p className="text-xs text-gray-400">{art.productName}</p>
            {art.status && (
              <Badge variant="outline" className="mt-1 text-xs">{art.status}</Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
