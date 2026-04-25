import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import type { GeneratedDocument, Invoice, OrderItem } from "@shared/schema";

interface InvoiceDocumentCardProps {
  invoice: Invoice;
  invoiceDocuments: GeneratedDocument[];
  latestInvoiceDoc: GeneratedDocument | null;
  isDocStale: boolean;
  isGenerating: boolean;
  isDeleting: boolean;
  hasLocalPdf: boolean;
  hasStripePdf: boolean;
  hasStripeInvoice: boolean;
  orderItems: OrderItem[];
  sendableDocument: { fileUrl: string | null; id: string | number } | null;
  onSendClick: () => void;
  onPreview: (doc: GeneratedDocument) => void;
  onDelete: (docId: number | string) => Promise<void> | void;
  onGeneratePdf: () => void;
  onStripePayment: () => void;
  stripePaymentPending: boolean;
}

export default function InvoiceDocumentCard({
  invoice,
  invoiceDocuments,
  latestInvoiceDoc,
  isDocStale,
  isGenerating,
  isDeleting,
  hasLocalPdf,
  hasStripePdf,
  hasStripeInvoice,
  orderItems,
  sendableDocument,
  onSendClick,
  onPreview,
  onDelete,
  onGeneratePdf,
  onStripePayment,
  stripePaymentPending,
}: InvoiceDocumentCardProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex gap-4 items-center justify-between w-full">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Invoice Document
          </CardTitle>
          {sendableDocument && invoice.status !== "paid" && (
            <Button size="sm" onClick={onSendClick}>
              <Send className="w-4 h-4 mr-1" />
              Send Invoice
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Local PDF documents */}
        {invoiceDocuments.map((doc) => (
          <GeneratedDocumentCard
            key={doc.id}
            document={doc}
            isStale={doc.id === latestInvoiceDoc?.id && !!isDocStale}
            onPreview={() => onPreview(doc)}
            onDelete={async () => { await onDelete(doc.id); }}
            onRegenerate={onGeneratePdf}
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
              onClick={onGeneratePdf}
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
              onClick={onGeneratePdf}
              disabled={isGenerating}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "Regenerating..." : "Regenerate PDF"}
            </Button>
          </div>
        )}

        {/* Stripe PDF section */}
        {hasStripePdf && (
          <div className="border-t pt-3 mt-3">
            <p className="text-xs text-gray-500 mb-2">Stripe Invoice PDF</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={invoice.stripeInvoicePdfUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Stripe Invoice PDF
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={invoice.stripeInvoiceUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View in Stripe
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Stripe invoice — auto-created with invoice, fallback button if missing */}
        {!hasStripeInvoice && (
          <div className="border-t pt-3 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onStripePayment}
              disabled={stripePaymentPending || orderItems.length === 0}
            >
              {stripePaymentPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-1" />
              )}
              Create Stripe Invoice
            </Button>
            <p className="text-xs text-gray-400 mt-1">
              Stripe link is auto-created for new invoices
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
