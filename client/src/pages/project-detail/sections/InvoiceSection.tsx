import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  CreditCard,
  FileText,
  Plus,
  Receipt,
  Send,
  Download,
  ExternalLink,
  Loader2,
  CheckCircle,
  Banknote,
  Clock,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { useProjectData } from "../hooks/useProjectData";
import type { SectionLockStatus } from "@/hooks/useLockStatus";
import LockBanner from "@/components/LockBanner";
import ProjectInfoBar from "@/components/ProjectInfoBar";
import SendInvoiceDialog from "@/components/modals/SendInvoiceDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InvoiceSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
  lockStatus?: SectionLockStatus;
}

const invoiceStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function InvoiceSection({ orderId, data, lockStatus }: InvoiceSectionProps) {
  const { order, invoice, invoiceLoading, orderItems, companyName, primaryContact, serviceCharges } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("check");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  // Invoice aging calculation
  const agingInfo = useMemo(() => {
    if (!invoice?.dueDate || invoice.status === "paid" || invoice.status === "cancelled") return null;
    const daysOverdue = differenceInDays(new Date(), new Date(invoice.dueDate));
    if (daysOverdue <= 0) return null;
    let category: string;
    let colorClass: string;
    if (daysOverdue <= 30) {
      category = "1-30 days";
      colorClass = "text-yellow-700 bg-yellow-50 border-yellow-200";
    } else if (daysOverdue <= 60) {
      category = "31-60 days";
      colorClass = "text-orange-700 bg-orange-50 border-orange-200";
    } else if (daysOverdue <= 90) {
      category = "61-90 days";
      colorClass = "text-red-600 bg-red-50 border-red-200";
    } else {
      category = "90+ days";
      colorClass = "text-red-800 bg-red-100 border-red-300";
    }
    return { daysOverdue, category, colorClass };
  }, [invoice?.dueDate, invoice?.status]);

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

  // Manual payment recording
  const manualPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error("No invoice");
      await apiRequest("POST", `/api/invoices/${invoice.id}/manual-payment`, {
        paymentMethod,
        paymentReference,
        amount: paymentAmount || invoice.totalAmount,
      });
    },
    onSuccess: () => {
      toast({ title: "Payment recorded", description: "Invoice marked as paid." });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/invoice`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      setShowPaymentDialog(false);
      setPaymentMethod("check");
      setPaymentReference("");
      setPaymentAmount("");
    },
    onError: () => {
      toast({ title: "Failed to record payment", variant: "destructive" });
    },
  });

  // Stripe payment link (also generates Stripe invoice PDF)
  const stripePaymentMutation = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error("No invoice");
      const res = await apiRequest("POST", `/api/invoices/${invoice.id}/payment-link`) as unknown as {
        paymentLink: string;
        stripeInvoiceId: string;
        stripeInvoicePdfUrl: string;
      };
      return res;
    },
    onSuccess: (data) => {
      if (data.paymentLink) {
        navigator.clipboard.writeText(data.paymentLink);
        toast({ title: "Stripe invoice created!", description: "Payment link copied to clipboard. Invoice PDF is now available from Stripe." });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/invoice`] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create Stripe invoice", description: error.message, variant: "destructive" });
    },
  });

  if (!order) return null;

  const hasStripePdf = !!invoice?.stripeInvoicePdfUrl;
  const hasStripeInvoice = !!invoice?.stripeInvoiceId;

  return (
    <div className="space-y-6">
      {lockStatus && <LockBanner lockStatus={lockStatus} sectionName="Invoice" sectionKey="invoice" orderId={orderId} />}

      <ProjectInfoBar companyName={companyName} primaryContact={primaryContact} />

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

              {agingInfo && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${agingInfo.colorClass}`}>
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {agingInfo.daysOverdue} days overdue
                  </span>
                  <span className="text-xs opacity-75">({agingInfo.category})</span>
                </div>
              )}

              {invoice.createdAt && (
                <p className="text-xs text-gray-400">
                  Created {format(new Date(invoice.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Invoice Document (from Stripe) */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Invoice Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasStripePdf ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">
                        {invoice.invoiceNumber}.pdf
                      </span>
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                        Stripe
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={invoice.stripeInvoicePdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-1" />
                          Download PDF
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View in Stripe
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowSendDialog(true)}
                        disabled={invoice.status === "paid"}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Send Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">
                    {hasStripeInvoice
                      ? "Stripe invoice exists but PDF URL is not available. Try generating a new payment link."
                      : "Generate a Stripe invoice to get a professional PDF invoice for your client."}
                  </p>
                  <Button
                    onClick={() => stripePaymentMutation.mutate()}
                    disabled={stripePaymentMutation.isPending || orderItems.length === 0}
                  >
                    {stripePaymentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Stripe Invoice...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        {hasStripeInvoice ? "Regenerate Stripe Invoice" : "Create Stripe Invoice"}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment
                </CardTitle>
                {invoice.status === "paid" && (
                  <Badge className="bg-green-100 text-green-800">PAID</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {invoice.status === "paid" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Payment received</span>
                  </div>
                  {invoice.paymentMethod && (
                    <p className="text-sm text-gray-500">
                      Method: {invoice.paymentMethod}
                      {invoice.paymentReference && ` (Ref: ${invoice.paymentReference})`}
                    </p>
                  )}
                  {invoice.paidAt && (
                    <p className="text-xs text-gray-400">
                      Paid on {format(new Date(invoice.paidAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Payment pending — ${Number(invoice.totalAmount || 0).toLocaleString()} due
                    {invoice.dueDate && ` by ${format(new Date(invoice.dueDate), "MMM d, yyyy")}`}
                  </p>

                  {/* Stripe payment link */}
                  {invoice.stripeInvoiceUrl ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(invoice.stripeInvoiceUrl);
                          toast({ title: "Payment link copied to clipboard" });
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Copy Payment Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer">
                          Open in Stripe
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => stripePaymentMutation.mutate()}
                      disabled={stripePaymentMutation.isPending}
                    >
                      {stripePaymentMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-1" />
                      )}
                      Generate Stripe Payment Link
                    </Button>
                  )}

                  {/* Manual payment */}
                  <Button
                    size="sm"
                    onClick={() => {
                      setPaymentAmount(String(invoice.totalAmount || ""));
                      setShowPaymentDialog(true);
                    }}
                  >
                    <Banknote className="w-4 h-4 mr-1" />
                    Record Manual Payment
                  </Button>
                </div>
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

      {/* Send Invoice Dialog — uses Stripe PDF URL */}
      {showSendDialog && invoice?.stripeInvoicePdfUrl && (
        <SendInvoiceDialog
          open={showSendDialog}
          onOpenChange={setShowSendDialog}
          orderId={orderId}
          recipientEmail={primaryContact?.email || ""}
          recipientName={primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName}
          companyName={companyName}
          orderNumber={(order as any)?.orderNumber || ""}
          invoiceNumber={invoice.invoiceNumber}
          invoiceDocument={{ fileUrl: invoice.stripeInvoicePdfUrl, id: invoice.stripeInvoiceId || "" }}
          totalAmount={Number(invoice.totalAmount || 0)}
          dueDate={invoice.dueDate}
        />
      )}

      {/* Manual Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Record Manual Payment
            </DialogTitle>
            <DialogDescription>
              Record an offline payment for Invoice #{invoice?.invoiceNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="wire">Wire Transfer</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="manual_card">Credit Card (Manual)</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Store Credit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Reference # (optional)</label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Check #, Wire ref, etc."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Amount</label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={String(invoice?.totalAmount || "0")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button
              onClick={() => manualPaymentMutation.mutate()}
              disabled={manualPaymentMutation.isPending}
              className="gap-1"
            >
              {manualPaymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
