import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateInvoice,
  useUpdateInvoiceDueDate,
  useUpdateInvoiceNotes,
  useRecordManualPayment,
  useCreateStripePayment,
} from "@/services/invoices";
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
  CalendarIcon,
  Info,
  RefreshCw,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { useProjectData } from "../hooks/useProjectData";
import type { SectionLockStatus } from "@/hooks/useLockStatus";
import LockBanner from "@/components/shared/LockBanner";
import ProjectInfoBar from "@/components/layout/ProjectInfoBar";
import SendInvoiceDialog from "@/components/modals/SendInvoiceDialog";
import InvoiceTemplate from "@/components/documents/InvoiceTemplate";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { DocumentEditor } from "@/components/feature/DocumentEditor";
import { useDocumentGeneration, buildItemsHash } from "@/hooks/useDocumentGeneration";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { order, invoice, invoiceLoading, orderItems, companyName, primaryContact, contacts, serviceCharges } = data;
  const { toast } = useToast();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("check");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [notesInitialized, setNotesInitialized] = useState(false);

  const templateRef = useRef<HTMLDivElement>(null);

  // Document generation hook
  const { invoiceDocuments, isGenerating, generateDocument, deleteDocument, isDeleting } = useDocumentGeneration(orderId);

  // Initialize notes from invoice data
  if (invoice && !notesInitialized) {
    setInvoiceNotes((invoice as any).notes || "");
    setNotesInitialized(true);
  }

  // Items hash for stale detection
  const currentItemsHash = useMemo(() => {
    if (!orderItems || orderItems.length === 0) return "";
    return buildItemsHash(orderItems, "quote", order);
  }, [orderItems, order]);

  // Check if latest invoice document is stale
  const latestInvoiceDoc = invoiceDocuments.length > 0 ? invoiceDocuments[invoiceDocuments.length - 1] : null;
  const isDocStale = latestInvoiceDoc && currentItemsHash && latestInvoiceDoc.metadata?.itemsHash !== currentItemsHash;

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

  const createInvoiceMutation = useCreateInvoice(orderId);
  const updateDueDateMutation = useUpdateInvoiceDueDate(orderId);
  const updateNotesMutation = useUpdateInvoiceNotes(orderId);
  const manualPaymentMutation = useRecordManualPayment(orderId);
  const stripePaymentMutation = useCreateStripePayment(orderId);

  // Generate local PDF
  const handleGeneratePdf = async () => {
    if (!invoice || !templateRef.current) return;
    try {
      await generateDocument({
        elementRef: templateRef.current,
        documentType: "invoice",
        documentNumber: invoice.invoiceNumber,
        itemsHash: currentItemsHash,
      });
      toast({ title: "Invoice PDF generated" });
    } catch (err) {
      // Error handled by hook
    }
  };

  if (!order) return null;

  const hasStripePdf = !!invoice?.stripeInvoicePdfUrl;
  const hasStripeInvoice = !!invoice?.stripeInvoiceId;
  const hasLocalPdf = invoiceDocuments.length > 0;

  // Determine which PDF to use for sending
  const sendableDocument = latestInvoiceDoc
    ? { fileUrl: latestInvoiceDoc.filePath, id: latestInvoiceDoc.id }
    : hasStripePdf
      ? { fileUrl: invoice?.stripeInvoicePdfUrl, id: invoice?.stripeInvoiceId || "" }
      : null;

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
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    Due Date
                  </p>
                  {invoice.status === "paid" ? (
                    <p className="font-medium">
                      {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "Not set"}
                    </p>
                  ) : (
                    <Input
                      type="date"
                      className="h-8 text-sm w-[150px]"
                      value={invoice.dueDate ? format(new Date(invoice.dueDate), "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          updateDueDateMutation.mutate(e.target.value);
                        }
                      }}
                    />
                  )}
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

              {/* CC Processing Fee Info */}
              <div className="flex items-start gap-2 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-800">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs">
                  A 3% credit card processing fee applies to payments made by credit/debit card.
                </p>
              </div>

              {/* Sent timestamp */}
              {(invoice as any).sentAt && (
                <p className="text-xs text-gray-400">
                  Sent on {format(new Date((invoice as any).sentAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}

              {invoice.createdAt && (
                <p className="text-xs text-gray-400">
                  Created {format(new Date(invoice.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Invoice Notes */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Invoice Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                onBlur={() => {
                  if (invoiceNotes !== ((invoice as any).notes || "")) {
                    updateNotesMutation.mutate(invoiceNotes);
                  }
                }}
                placeholder="Add notes to this invoice (visible on PDF)..."
                className="min-h-[80px] resize-none text-sm"
                disabled={invoice.status === "paid"}
              />
            </CardContent>
          </Card>

          {/* Invoice Document */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Invoice Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Local PDF documents */}
              {invoiceDocuments.map((doc: any) => (
                <GeneratedDocumentCard
                  key={doc.id}
                  document={doc}
                  isStale={doc.id === latestInvoiceDoc?.id && !!isDocStale}
                  onPreview={() => setPreviewDoc(doc)}
                  onDelete={() => deleteDocument(doc.id)}
                  onRegenerate={handleGeneratePdf}
                  isDeleting={isDeleting}
                  isRegenerating={isGenerating}
                />
              ))}

              {/* Generate PDF button */}
              {!hasLocalPdf && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">
                    Generate a professional invoice PDF for your client.
                  </p>
                  <Button
                    onClick={handleGeneratePdf}
                    disabled={isGenerating || orderItems.length === 0}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Invoice PDF
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Regenerate button when doc exists but is stale */}
              {hasLocalPdf && isDocStale && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePdf}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate PDF
                  </Button>
                </div>
              )}

              {/* Stripe PDF section */}
              {hasStripePdf && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-gray-500 mb-2">Stripe Invoice PDF</p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={invoice.stripeInvoicePdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-1" />
                        Stripe Invoice PDF
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View in Stripe
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Stripe generation if no Stripe invoice yet */}
              {!hasStripeInvoice && (
                <div className="border-t pt-3 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => stripePaymentMutation.mutate(invoice!.id, {
                      onSuccess: (data: any) => {
                        if (data.paymentLink) {
                          navigator.clipboard.writeText(data.paymentLink);
                          toast({ title: "Payment link copied to clipboard", description: "Invoice PDF is now available from Stripe." });
                        }
                      },
                    })}
                    disabled={stripePaymentMutation.isPending || orderItems.length === 0}
                  >
                    {stripePaymentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-1" />
                    )}
                    Create Stripe Invoice
                  </Button>
                </div>
              )}

              {/* Send Invoice button */}
              {sendableDocument && invoice.status !== "paid" && (
                <div className="border-t pt-3 mt-3">
                  <Button
                    size="sm"
                    onClick={() => setShowSendDialog(true)}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send Invoice
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
                      <Button variant="ghost" size="sm" asChild>
                        <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer">
                          Open in Stripe
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => stripePaymentMutation.mutate(invoice!.id, {
                        onSuccess: (data: any) => {
                          if (data.paymentLink) {
                            navigator.clipboard.writeText(data.paymentLink);
                            toast({ title: "Payment link copied to clipboard", description: "Invoice PDF is now available from Stripe." });
                          }
                        },
                      })}
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

          {/* Reminder info */}
          {(invoice as any).reminderEnabled && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Payment Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-1">
                <p>Reminders: Every {(invoice as any).reminderFrequencyDays} days</p>
                {(invoice as any).nextReminderDate && (
                  <p>Next reminder: {format(new Date((invoice as any).nextReminderDate), "MMM d, yyyy")}</p>
                )}
                {(invoice as any).lastReminderSentAt && (
                  <p className="text-xs text-gray-400">Last sent: {format(new Date((invoice as any).lastReminderSentAt), "MMM d, yyyy 'at' h:mm a")}</p>
                )}
              </CardContent>
            </Card>
          )}
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

      {/* Hidden Invoice Template for PDF generation */}
      {invoice && (
        <InvoiceTemplate
          ref={templateRef}
          invoice={{ ...invoice, notes: invoiceNotes }}
          order={order}
          orderItems={orderItems}
          companyName={companyName}
          primaryContact={primaryContact}
          serviceCharges={serviceCharges}
        />
      )}

      {/* Document Preview */}
      {previewDoc && (
        <DocumentEditor
          document={previewDoc}
          order={order}
          orderItems={orderItems}
          companyName={companyName}
          primaryContact={primaryContact}
          getEditedItem={getEditedItem}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Send Invoice Dialog */}
      {showSendDialog && invoice && sendableDocument && (
        <SendInvoiceDialog
          open={showSendDialog}
          onOpenChange={setShowSendDialog}
          orderId={orderId}
          recipientEmail={primaryContact?.email || ""}
          recipientName={primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName}
          companyName={companyName}
          orderNumber={(order as any)?.orderNumber || ""}
          invoiceNumber={invoice.invoiceNumber}
          invoiceDocument={sendableDocument}
          totalAmount={Number(invoice.totalAmount || 0)}
          dueDate={invoice.dueDate}
          contacts={(contacts || []).map((c: any) => ({ id: String(c.id), firstName: c.firstName || "", lastName: c.lastName || "", email: c.email, isPrimary: c.isPrimary, title: c.title, receiveOrderEmails: c.receiveOrderEmails }))}
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
              onClick={() => manualPaymentMutation.mutate(
                {
                  invoiceId: invoice!.id,
                  data: {
                    paymentMethod,
                    paymentReference,
                    amount: paymentAmount || invoice!.totalAmount,
                  },
                },
                {
                  onSuccess: () => {
                    setShowPaymentDialog(false);
                    setPaymentMethod("check");
                    setPaymentReference("");
                    setPaymentAmount("");
                  },
                },
              )}
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
