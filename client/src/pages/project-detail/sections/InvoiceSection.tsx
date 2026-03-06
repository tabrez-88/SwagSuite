import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  DollarSign,
  FileText,
  Plus,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import type { useProjectData } from "../hooks/useProjectData";
import type { SectionLockStatus } from "@/hooks/useLockStatus";
import LockBanner from "@/components/LockBanner";

interface InvoiceSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
  lockStatus?: SectionLockStatus;
}

const invoiceStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function InvoiceSection({ orderId, data, lockStatus }: InvoiceSectionProps) {
  const { order, invoice, invoiceLoading } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/invoice`] });
      toast({ title: "Invoice created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to create invoice", variant: "destructive" });
    },
  });

  if (!order) return null;

  return (
    <div className="space-y-6">
      {lockStatus && <LockBanner lockStatus={lockStatus} sectionName="Invoice" sectionKey="invoice" orderId={orderId} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Invoice
          </h2>
          <p className="text-sm text-gray-500">
            Customer invoices and payment tracking
          </p>
        </div>
        {!invoice && (
          <Button
            onClick={() => createInvoiceMutation.mutate()}
            disabled={createInvoiceMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        )}
      </div>

      {invoiceLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading invoice...</p>
          </CardContent>
        </Card>
      ) : invoice ? (
        <div className="space-y-4">
          {/* Invoice Overview */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Invoice #{invoice.invoiceNumber}
                </CardTitle>
                <Badge className={invoiceStatusColors[invoice.status] || ""}>
                  {invoice.status?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="font-medium">${Number(invoice.subtotal || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tax</p>
                  <p className="font-medium">${Number(invoice.taxAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-bold text-lg">${Number(invoice.totalAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium">
                    {invoice.dueDate
                      ? format(new Date(invoice.dueDate), "MMM d, yyyy")
                      : "Not set"}
                  </p>
                </div>
              </div>

              {invoice.createdAt && (
                <p className="text-xs text-gray-400">
                  Created {format(new Date(invoice.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.status === "paid" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-medium">Payment received</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Payment pending — ${Number(invoice.totalAmount || 0).toLocaleString()} due
                  {invoice.dueDate && ` by ${format(new Date(invoice.dueDate), "MMM d, yyyy")}`}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoice yet</h3>
            <p className="text-gray-500 mb-4">
              Create an invoice to start tracking payments for this project
            </p>
            <Button
              onClick={() => createInvoiceMutation.mutate()}
              disabled={createInvoiceMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
