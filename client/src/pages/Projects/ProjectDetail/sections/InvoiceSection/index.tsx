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
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { PdfPreviewDialog } from "@/components/documents/pdf/PdfPreviewDialog";
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
  const { projectId, lockStatus } = props;
  const hook = useInvoiceSection(props);

  if (!hook.order) return null;

  return (
    <div className="space-y-6">
      {lockStatus && <LockBanner lockStatus={lockStatus} sectionName="Invoice" sectionKey="invoice" projectId={projectId} />}

      <ProjectInfoBar companyName={hook.companyName} primaryContact={hook.primaryContact} />

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
        {!hook.invoice && (
          <Button
            onClick={() => hook.createInvoiceMutation.mutate()}
            disabled={hook.createInvoiceMutation.isPending}
          >
            {hook.createInvoiceMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            {hook.createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        )}
      </div>

      {hook.invoiceLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading invoice...</p>
          </CardContent>
        </Card>
      ) : hook.invoice ? (
        <div className="space-y-4">
          {/* Invoice Overview */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Invoice #{hook.invoice.invoiceNumber}
                </CardTitle>
                <Badge className={invoiceStatusColors[hook.invoice.status ?? ""] || ""}>
                  {hook.invoice.status?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="font-medium">${Number(hook.invoice.subtotal || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tax</p>
                  <p className="font-medium">${Number(hook.invoice.taxAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-bold text-lg">${Number(hook.invoice.totalAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    Due Date
                  </p>
                  {hook.invoice.status === "paid" ? (
                    <p className="font-medium">
                      {hook.invoice.dueDate ? format(new Date(hook.invoice.dueDate), "MMM d, yyyy") : "Not set"}
                    </p>
                  ) : (
                    <Input
                      type="date"
                      className="h-8 text-sm w-[150px]"
                      value={hook.invoice.dueDate ? format(new Date(hook.invoice.dueDate), "yyyy-MM-dd") : ""}
                      onChange={(e) => hook.handleDueDateChange(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {hook.agingInfo && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${hook.agingInfo.colorClass}`}>
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {hook.agingInfo.daysOverdue} days overdue
                  </span>
                  <span className="text-xs opacity-75">({hook.agingInfo.category})</span>
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
              {(hook.invoice as Record<string, string | boolean | null>).sentAt && (
                <p className="text-xs text-gray-400">
                  Sent on {format(new Date((hook.invoice as Record<string, string | boolean | null>).sentAt as string), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}

              {hook.invoice.createdAt && (
                <p className="text-xs text-gray-400">
                  Created {format(new Date(hook.invoice.createdAt), "MMM d, yyyy 'at' h:mm a")}
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
                value={hook.invoiceNotes}
                onChange={(e) => hook.handleNotesChange(e.target.value)}
                onBlur={hook.handleNotesBlur}
                placeholder="Add notes to this invoice (visible on PDF)..."
                className="min-h-[80px] resize-none text-sm"
                disabled={hook.invoice.status === "paid"}
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
              {hook.invoiceDocuments.map((doc) => (
                <GeneratedDocumentCard
                  key={doc.id}
                  document={doc}
                  isStale={doc.id === hook.latestInvoiceDoc?.id && !!hook.isDocStale}
                  onPreview={() => hook.setPreviewDoc(doc)}
                  onDelete={() => hook.handleDeleteDocument(doc.id)}
                  onRegenerate={hook.handleGeneratePdf}
                  isDeleting={hook.isDeleting}
                  isRegenerating={hook.isGenerating}
                />
              ))}

              {/* Generate PDF button */}
              {!hook.hasLocalPdf && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">
                    Generate a professional invoice PDF for your client.
                  </p>
                  <Button
                    onClick={hook.handleGeneratePdf}
                    disabled={hook.isGenerating || hook.orderItems.length === 0}
                  >
                    {hook.isGenerating ? (
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
              {hook.hasLocalPdf && hook.isDocStale && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={hook.handleGeneratePdf}
                    disabled={hook.isGenerating}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${hook.isGenerating ? "animate-spin" : ""}`} />
                    {hook.isGenerating ? "Regenerating..." : "Regenerate PDF"}
                  </Button>
                </div>
              )}

              {/* Stripe PDF section */}
              {hook.hasStripePdf && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-gray-500 mb-2">Stripe Invoice PDF</p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={hook.invoice.stripeInvoicePdfUrl ?? undefined} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-1" />
                        Stripe Invoice PDF
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={hook.invoice.stripeInvoiceUrl ?? undefined} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View in Stripe
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Stripe invoice — auto-created with invoice, fallback button if missing */}
              {!hook.hasStripeInvoice && (
                <div className="border-t pt-3 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={hook.handleStripePayment}
                    disabled={hook.stripePaymentMutation.isPending || hook.orderItems.length === 0}
                  >
                    {hook.stripePaymentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-1" />
                    )}
                    Create Stripe Invoice
                  </Button>
                  <p className="text-xs text-gray-400 mt-1">Stripe link is auto-created for new invoices</p>
                </div>
              )}

              {/* Send Invoice button */}
              {hook.sendableDocument && hook.invoice.status !== "paid" && (
                <div className="border-t pt-3 mt-3">
                  <Button
                    size="sm"
                    onClick={() => hook.setShowSendDialog(true)}
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
                {hook.invoice.status === "paid" && (
                  <Badge className="bg-green-100 text-green-800">PAID</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hook.invoice.status === "paid" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Payment received</span>
                  </div>
                  {hook.invoice.paymentMethod && (
                    <p className="text-sm text-gray-500">
                      Method: {hook.invoice.paymentMethod}
                      {hook.invoice.paymentReference && ` (Ref: ${hook.invoice.paymentReference})`}
                    </p>
                  )}
                  {hook.invoice.paidAt && (
                    <p className="text-xs text-gray-400">
                      Paid on {format(new Date(hook.invoice.paidAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Payment pending — ${Number(hook.invoice.totalAmount || 0).toLocaleString()} due
                    {hook.invoice.dueDate && ` by ${format(new Date(hook.invoice.dueDate), "MMM d, yyyy")}`}
                  </p>

                  {/* Stripe payment link (auto-created with invoice) */}
                  {hook.invoice.stripeInvoiceUrl && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={hook.handleCopyPaymentLink}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Copy Payment Link
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={hook.invoice.stripeInvoiceUrl ?? undefined} target="_blank" rel="noopener noreferrer">
                          Open in Stripe
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Manual payment */}
                  <Button
                    size="sm"
                    onClick={hook.handleOpenPaymentDialog}
                  >
                    <Banknote className="w-4 h-4 mr-1" />
                    Record Manual Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminder info */}
          {(hook.invoice as Record<string, string | boolean | null>).reminderEnabled && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Payment Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-1">
                <p>Reminders: Every {(hook.invoice as Record<string, string | boolean | null>).reminderFrequencyDays} days</p>
                {(hook.invoice as Record<string, string | boolean | null>).nextReminderDate && (
                  <p>Next reminder: {format(new Date((hook.invoice as Record<string, string | boolean | null>).nextReminderDate as string), "MMM d, yyyy")}</p>
                )}
                {(hook.invoice as Record<string, string | boolean | null>).lastReminderSentAt && (
                  <p className="text-xs text-gray-400">Last sent: {format(new Date((hook.invoice as Record<string, string | boolean | null>).lastReminderSentAt as string), "MMM d, yyyy 'at' h:mm a")}</p>
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
              onClick={() => hook.createInvoiceMutation.mutate()}
              disabled={hook.createInvoiceMutation.isPending}
            >
              {hook.createInvoiceMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              {hook.createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Live PDF preview (uses react-pdf PDFViewer — same renderer as save) */}
      {hook.invoice && (
        <PdfPreviewDialog
          open={hook.showLivePreview}
          onOpenChange={hook.setShowLivePreview}
          title={`Invoice Preview — ${hook.invoice.invoiceNumber || ""}`}
          document={hook.showLivePreview ? hook.buildInvoiceDoc() : null}
        />
      )}

      {/* Document Preview */}
      {hook.previewDoc && (
        <DocumentEditor
          document={hook.previewDoc}
          order={hook.order}
          orderItems={hook.orderItems}
          companyName={hook.companyName}
          primaryContact={hook.primaryContact}
          getEditedItem={hook.getEditedItem}
          onClose={() => hook.setPreviewDoc(null)}
        />
      )}

      {/* Send Invoice Dialog */}
      {hook.showSendDialog && hook.invoice && hook.sendableDocument && (
        <SendInvoiceDialog
          open={hook.showSendDialog}
          onOpenChange={hook.setShowSendDialog}
          projectId={projectId}
          recipientEmail={hook.primaryContact?.email || ""}
          recipientName={hook.primaryContact ? `${hook.primaryContact.firstName} ${hook.primaryContact.lastName}` : hook.companyName}
          companyName={hook.companyName}
          orderNumber={hook.order?.orderNumber || ""}
          invoiceNumber={hook.invoice.invoiceNumber}
          invoiceId={String(hook.invoice.id)}
          invoiceDocument={hook.sendableDocument}
          totalAmount={Number(hook.invoice.totalAmount || 0)}
          dueDate={(hook.invoice.dueDate as unknown as string) ?? undefined}
          contacts={hook.formattedContacts}
          stripeInvoiceUrl={hook.invoice.stripeInvoiceUrl ?? undefined}
          assignedUserEmail={props.data?.assignedUser?.email}
        />
      )}

      {/* Manual Payment Dialog */}
      <Dialog open={hook.showPaymentDialog} onOpenChange={hook.setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Record Manual Payment
            </DialogTitle>
            <DialogDescription>
              Record an offline payment for Invoice #{hook.invoice?.invoiceNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Payment Method</label>
              <Select value={hook.paymentMethod} onValueChange={hook.setPaymentMethod}>
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
                value={hook.paymentReference}
                onChange={(e) => hook.setPaymentReference(e.target.value)}
                placeholder="Check #, Wire ref, etc."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Amount</label>
              <Input
                type="number"
                step="0.01"
                value={hook.paymentAmount}
                onChange={(e) => hook.setPaymentAmount(e.target.value)}
                placeholder={String(hook.invoice?.totalAmount || "0")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => hook.setShowPaymentDialog(false)}>Cancel</Button>
            <Button
              onClick={hook.handleRecordPayment}
              disabled={hook.manualPaymentMutation.isPending}
            >
              {hook.manualPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
