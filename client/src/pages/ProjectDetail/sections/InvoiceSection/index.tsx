import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { format } from "date-fns";
import LockBanner from "@/components/shared/LockBanner";
import ProjectInfoBar from "@/components/layout/ProjectInfoBar";
import SendInvoiceDialog from "@/components/modals/SendInvoiceDialog";
import InvoiceTemplate from "@/components/documents/InvoiceTemplate";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { DocumentEditor } from "@/components/feature/DocumentEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInvoiceSection } from "./hooks";
import { invoiceStatusColors } from "./types";
import type { InvoiceSectionProps } from "./types";

export default function InvoiceSection(props: InvoiceSectionProps) {
  const { orderId, lockStatus } = props;
  const h = useInvoiceSection(props);

  if (!h.order) return null;

  return (
    <div className="space-y-6">
      {lockStatus && <LockBanner lockStatus={lockStatus} sectionName="Invoice" sectionKey="invoice" orderId={orderId} />}

      <ProjectInfoBar companyName={h.companyName} primaryContact={h.primaryContact} />

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
        {!h.invoice && (
          <Button
            onClick={() => h.createInvoiceMutation.mutate()}
            disabled={h.createInvoiceMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            {h.createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        )}
      </div>

      {h.invoiceLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading invoice...</p>
          </CardContent>
        </Card>
      ) : h.invoice ? (
        <div className="space-y-4">
          {/* Invoice Overview */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Invoice #{h.invoice.invoiceNumber}
                </CardTitle>
                <Badge className={invoiceStatusColors[h.invoice.status] || ""}>
                  {h.invoice.status?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="font-medium">${Number(h.invoice.subtotal || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tax</p>
                  <p className="font-medium">${Number(h.invoice.taxAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-bold text-lg">${Number(h.invoice.totalAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    Due Date
                  </p>
                  {h.invoice.status === "paid" ? (
                    <p className="font-medium">
                      {h.invoice.dueDate ? format(new Date(h.invoice.dueDate), "MMM d, yyyy") : "Not set"}
                    </p>
                  ) : (
                    <Input
                      type="date"
                      className="h-8 text-sm w-[150px]"
                      value={h.invoice.dueDate ? format(new Date(h.invoice.dueDate), "yyyy-MM-dd") : ""}
                      onChange={(e) => h.handleDueDateChange(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {h.agingInfo && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${h.agingInfo.colorClass}`}>
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {h.agingInfo.daysOverdue} days overdue
                  </span>
                  <span className="text-xs opacity-75">({h.agingInfo.category})</span>
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
              {(h.invoice as any).sentAt && (
                <p className="text-xs text-gray-400">
                  Sent on {format(new Date((h.invoice as any).sentAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}

              {h.invoice.createdAt && (
                <p className="text-xs text-gray-400">
                  Created {format(new Date(h.invoice.createdAt), "MMM d, yyyy 'at' h:mm a")}
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
                value={h.invoiceNotes}
                onChange={(e) => h.handleNotesChange(e.target.value)}
                onBlur={h.handleNotesBlur}
                placeholder="Add notes to this invoice (visible on PDF)..."
                className="min-h-[80px] resize-none text-sm"
                disabled={h.invoice.status === "paid"}
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
              {h.invoiceDocuments.map((doc: any) => (
                <GeneratedDocumentCard
                  key={doc.id}
                  document={doc}
                  isStale={doc.id === h.latestInvoiceDoc?.id && !!h.isDocStale}
                  onPreview={() => h.setPreviewDoc(doc)}
                  onDelete={() => h.handleDeleteDocument(doc.id)}
                  onRegenerate={h.handleGeneratePdf}
                  isDeleting={h.isDeleting}
                  isRegenerating={h.isGenerating}
                />
              ))}

              {/* Generate PDF button */}
              {!h.hasLocalPdf && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">
                    Generate a professional invoice PDF for your client.
                  </p>
                  <Button
                    onClick={h.handleGeneratePdf}
                    disabled={h.isGenerating || h.orderItems.length === 0}
                  >
                    {h.isGenerating ? (
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
              {h.hasLocalPdf && h.isDocStale && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={h.handleGeneratePdf}
                    disabled={h.isGenerating}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate PDF
                  </Button>
                </div>
              )}

              {/* Stripe PDF section */}
              {h.hasStripePdf && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-gray-500 mb-2">Stripe Invoice PDF</p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={h.invoice.stripeInvoicePdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-1" />
                        Stripe Invoice PDF
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={h.invoice.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View in Stripe
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Stripe generation if no Stripe invoice yet */}
              {!h.hasStripeInvoice && (
                <div className="border-t pt-3 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={h.handleStripePayment}
                    disabled={h.stripePaymentMutation.isPending || h.orderItems.length === 0}
                  >
                    {h.stripePaymentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-1" />
                    )}
                    Create Stripe Invoice
                  </Button>
                </div>
              )}

              {/* Send Invoice button */}
              {h.sendableDocument && h.invoice.status !== "paid" && (
                <div className="border-t pt-3 mt-3">
                  <Button
                    size="sm"
                    onClick={() => h.setShowSendDialog(true)}
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
                {h.invoice.status === "paid" && (
                  <Badge className="bg-green-100 text-green-800">PAID</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {h.invoice.status === "paid" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Payment received</span>
                  </div>
                  {h.invoice.paymentMethod && (
                    <p className="text-sm text-gray-500">
                      Method: {h.invoice.paymentMethod}
                      {h.invoice.paymentReference && ` (Ref: ${h.invoice.paymentReference})`}
                    </p>
                  )}
                  {h.invoice.paidAt && (
                    <p className="text-xs text-gray-400">
                      Paid on {format(new Date(h.invoice.paidAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Payment pending — ${Number(h.invoice.totalAmount || 0).toLocaleString()} due
                    {h.invoice.dueDate && ` by ${format(new Date(h.invoice.dueDate), "MMM d, yyyy")}`}
                  </p>

                  {/* Stripe payment link */}
                  {h.invoice.stripeInvoiceUrl ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={h.handleCopyPaymentLink}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Copy Payment Link
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={h.invoice.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer">
                          Open in Stripe
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={h.handleStripePayment}
                      disabled={h.stripePaymentMutation.isPending}
                    >
                      {h.stripePaymentMutation.isPending ? (
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
                    onClick={h.handleOpenPaymentDialog}
                  >
                    <Banknote className="w-4 h-4 mr-1" />
                    Record Manual Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminder info */}
          {(h.invoice as any).reminderEnabled && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Payment Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-1">
                <p>Reminders: Every {(h.invoice as any).reminderFrequencyDays} days</p>
                {(h.invoice as any).nextReminderDate && (
                  <p>Next reminder: {format(new Date((h.invoice as any).nextReminderDate), "MMM d, yyyy")}</p>
                )}
                {(h.invoice as any).lastReminderSentAt && (
                  <p className="text-xs text-gray-400">Last sent: {format(new Date((h.invoice as any).lastReminderSentAt), "MMM d, yyyy 'at' h:mm a")}</p>
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
              onClick={() => h.createInvoiceMutation.mutate()}
              disabled={h.createInvoiceMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Hidden Invoice Template for PDF generation */}
      {h.invoice && (
        <InvoiceTemplate
          ref={h.templateRef}
          invoice={{ ...h.invoice, notes: h.invoiceNotes }}
          order={h.order}
          orderItems={h.orderItems}
          companyName={h.companyName}
          primaryContact={h.primaryContact}
          serviceCharges={h.serviceCharges}
        />
      )}

      {/* Document Preview */}
      {h.previewDoc && (
        <DocumentEditor
          document={h.previewDoc}
          order={h.order}
          orderItems={h.orderItems}
          companyName={h.companyName}
          primaryContact={h.primaryContact}
          getEditedItem={h.getEditedItem}
          onClose={() => h.setPreviewDoc(null)}
        />
      )}

      {/* Send Invoice Dialog */}
      {h.showSendDialog && h.invoice && h.sendableDocument && (
        <SendInvoiceDialog
          open={h.showSendDialog}
          onOpenChange={h.setShowSendDialog}
          orderId={orderId}
          recipientEmail={h.primaryContact?.email || ""}
          recipientName={h.primaryContact ? `${h.primaryContact.firstName} ${h.primaryContact.lastName}` : h.companyName}
          companyName={h.companyName}
          orderNumber={(h.order as any)?.orderNumber || ""}
          invoiceNumber={h.invoice.invoiceNumber}
          invoiceDocument={h.sendableDocument}
          totalAmount={Number(h.invoice.totalAmount || 0)}
          dueDate={h.invoice.dueDate}
          contacts={h.formattedContacts}
        />
      )}

      {/* Manual Payment Dialog */}
      <Dialog open={h.showPaymentDialog} onOpenChange={h.setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Record Manual Payment
            </DialogTitle>
            <DialogDescription>
              Record an offline payment for Invoice #{h.invoice?.invoiceNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Payment Method</label>
              <Select value={h.paymentMethod} onValueChange={h.setPaymentMethod}>
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
                value={h.paymentReference}
                onChange={(e) => h.setPaymentReference(e.target.value)}
                placeholder="Check #, Wire ref, etc."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Amount</label>
              <Input
                type="number"
                step="0.01"
                value={h.paymentAmount}
                onChange={(e) => h.setPaymentAmount(e.target.value)}
                placeholder={String(h.invoice?.totalAmount || "0")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => h.setShowPaymentDialog(false)}>Cancel</Button>
            <Button
              onClick={h.handleRecordPayment}
              disabled={h.manualPaymentMutation.isPending}
              className="gap-1"
            >
              {h.manualPaymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
