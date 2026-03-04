import { useState, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowRight,
  Calculator,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Send,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { useProjectData } from "../hooks/useProjectData";
import StageConversionDialog from "../components/StageConversionDialog";

const estimateStatuses = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "sent", label: "Sent to Client", color: "bg-blue-100 text-blue-800" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "expired", label: "Expired", color: "bg-yellow-100 text-yellow-800" },
];

interface EstimateSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}

export default function EstimateSection({ orderId, data }: EstimateSectionProps) {
  const { order, orderItems, allItemLines, allItemCharges, quoteApprovals, companyName, primaryContact, allProducts } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConversionDialog, setShowConversionDialog] = useState(false);

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
        estimateStatus: newStatus,
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

  const currentStatus = (order as any)?.estimateStatus || "draft";
  const statusInfo = estimateStatuses.find((s) => s.value === currentStatus) || estimateStatuses[0];
  const isQuotePhase = currentStatus === "draft" || currentStatus === "sent";

  // Calculate totals
  const totalItems = orderItems.length;
  const totalQty = orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  const subtotal = Number(order.subtotal || 0);
  const total = Number(order.total || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Estimate
          </h2>
          <p className="text-sm text-gray-500">
            Quote and estimate details for {companyName}
          </p>
        </div>
        <Select value={currentStatus} onValueChange={(val) => updateStatusMutation.mutate(val)}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${statusInfo.color.split(" ")[0]}`} />
                {statusInfo.label}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {estimateStatuses.map((s) => (
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

      {/* Stage Conversion Banner */}
      {data.businessStage?.stage.id === "estimate" && currentStatus === "approved" && (
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200 rounded-lg px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Estimate approved!</h3>
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

      {/* Estimate Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">Items</p>
            <p className="text-2xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">Total Qty</p>
            <p className="text-2xl font-bold">{totalQty.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">Subtotal</p>
            <p className="text-2xl font-bold">${subtotal.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold text-green-600">${total.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quote Items */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Quote Line Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orderItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No items added to this estimate yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-gray-500">Product</th>
                    <th className="pb-2 font-medium text-gray-500">SKU</th>
                    <th className="pb-2 font-medium text-gray-500">Color</th>
                    <th className="pb-2 font-medium text-gray-500 text-right">Qty</th>
                    <th className="pb-2 font-medium text-gray-500 text-right">Unit Price</th>
                    <th className="pb-2 font-medium text-gray-500 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item: any) => {
                    const lines = allItemLines[item.id] || [];
                    const charges = allItemCharges[item.id] || [];
                    const itemTotal = Number(item.totalPrice || 0);
                    const chargesTotal = charges.reduce((s: number, c: any) => s + Number(c.amount || 0), 0);

                    return (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3">
                          <p className="font-medium">{item.productName}</p>
                          {item.supplierName && (
                            <p className="text-xs text-gray-400">{item.supplierName}</p>
                          )}
                        </td>
                        <td className="py-3 text-gray-500">{item.productSku || "-"}</td>
                        <td className="py-3 text-gray-500">{item.color || "-"}</td>
                        <td className="py-3 text-right">{item.quantity || 0}</td>
                        <td className="py-3 text-right">${Number(item.unitPrice || 0).toFixed(2)}</td>
                        <td className="py-3 text-right font-medium">
                          ${(itemTotal + chargesTotal).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={5} className="py-3 text-right font-bold">Total</td>
                    <td className="py-3 text-right font-bold text-green-600">
                      ${total.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
                  Send this estimate to {primaryContact.firstName} {primaryContact.lastName} for approval
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

      {showConversionDialog && (
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
      )}
    </div>
  );
}
