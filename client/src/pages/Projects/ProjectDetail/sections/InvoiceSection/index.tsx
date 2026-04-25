import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import LockBanner from "@/components/shared/LockBanner";
import ProjectInfoBar from "@/components/layout/ProjectInfoBar";
import SendInvoiceDialog from "@/components/modals/SendInvoiceDialog";
import { PdfPreviewDialog } from "@/components/documents/pdf/PdfPreviewDialog";
import { DocumentEditor } from "@/components/feature/DocumentEditor";

import { useInvoiceSection } from "./hooks";
import type { InvoiceSectionProps } from "./types";

import InvoiceOverviewCard from "./components/InvoiceOverviewCard";
import InvoiceNotesCard from "./components/InvoiceNotesCard";
import InvoiceDocumentCard from "./components/InvoiceDocumentCard";
import PaymentCard from "./components/PaymentCard";
import PaymentReminderCard from "./components/PaymentReminderCard";
import ManualPaymentDialog from "./components/ManualPaymentDialog";
import CreateInvoiceButton from "./components/CreateInvoiceButton";

export default function InvoiceSection(props: InvoiceSectionProps) {
  const { projectId, lockStatus } = props;
  const hook = useInvoiceSection(props);

  if (!hook.order) return null;

  const createButtonProps = {
    hasDeposit: hook.hasDeposit,
    depositReceived: hook.depositReceived,
    createInvoiceMutation: hook.createInvoiceMutation,
    createDepositInvoiceMutation: hook.createDepositInvoiceMutation,
    createFinalInvoiceMutation: hook.createFinalInvoiceMutation,
  };

  return (
    <div className="space-y-6">
      {lockStatus && (
        <LockBanner
          lockStatus={lockStatus}
          sectionName="Invoice"
          sectionKey="invoice"
          projectId={projectId}
        />
      )}

      <ProjectInfoBar
        companyName={hook.companyName}
        primaryContact={hook.primaryContact}
      />

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
          <div className="flex items-center gap-2">
            <CreateInvoiceButton {...createButtonProps} />
          </div>
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
          <InvoiceOverviewCard
            invoice={hook.invoice}
            agingInfo={hook.agingInfo}
            onDueDateChange={hook.handleDueDateChange}
          />

          <InvoiceNotesCard
            notes={hook.invoiceNotes}
            isPaid={hook.invoice.status === "paid"}
            onNotesChange={hook.handleNotesChange}
            onNotesBlur={hook.handleNotesBlur}
          />

          <InvoiceDocumentCard
            invoice={hook.invoice}
            invoiceDocuments={hook.invoiceDocuments}
            latestInvoiceDoc={hook.latestInvoiceDoc}
            isDocStale={!!hook.isDocStale}
            isGenerating={hook.isGenerating}
            isDeleting={hook.isDeleting}
            hasLocalPdf={hook.hasLocalPdf}
            hasStripePdf={hook.hasStripePdf}
            hasStripeInvoice={hook.hasStripeInvoice}
            orderItems={hook.orderItems}
            sendableDocument={hook.sendableDocument}
            onSendClick={() => hook.setShowSendDialog(true)}
            onPreview={(doc) => hook.setPreviewDoc(doc)}
            onDelete={hook.handleDeleteDocument}
            onGeneratePdf={hook.handleGeneratePdf}
            onStripePayment={hook.handleStripePayment}
            stripePaymentPending={hook.stripePaymentMutation.isPending}
          />

          <PaymentCard
            invoice={hook.invoice}
            onCopyPaymentLink={hook.handleCopyPaymentLink}
            onOpenPaymentDialog={hook.handleOpenPaymentDialog}
          />

          <PaymentReminderCard invoice={hook.invoice} />
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No invoice yet
            </h3>
            <p className="text-gray-500 mb-4">
              {hook.hasDeposit && !hook.depositReceived
                ? "Create a deposit invoice to collect upfront payment"
                : hook.hasDeposit && hook.depositReceived
                  ? "Deposit received. Create a final invoice for the remaining balance"
                  : "Create an invoice to start tracking payments for this project"}
            </p>
            <CreateInvoiceButton {...createButtonProps} />
          </CardContent>
        </Card>
      )}

      {/* Live PDF preview */}
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
          recipientName={
            hook.primaryContact
              ? `${hook.primaryContact.firstName} ${hook.primaryContact.lastName}`
              : hook.companyName
          }
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
      <ManualPaymentDialog
        open={hook.showPaymentDialog}
        onOpenChange={hook.setShowPaymentDialog}
        invoiceNumber={hook.invoice?.invoiceNumber || ""}
        paymentMethod={hook.paymentMethod}
        onPaymentMethodChange={hook.setPaymentMethod}
        paymentReference={hook.paymentReference}
        onPaymentReferenceChange={hook.setPaymentReference}
        paymentAmount={hook.paymentAmount}
        onPaymentAmountChange={hook.setPaymentAmount}
        totalAmount={String(hook.invoice?.totalAmount || "0")}
        isPending={hook.manualPaymentMutation.isPending}
        onRecordPayment={hook.handleRecordPayment}
      />
    </div>
  );
}
