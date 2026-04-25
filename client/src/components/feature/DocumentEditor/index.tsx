/**
 * DocumentEditor — simple saved-document viewer.
 *
 * Previously this was a complex html2canvas-based editable preview that
 * rasterized a Tailwind template into a PDF on save. With the migration to
 * @react-pdf/renderer, the saved file at `doc.fileUrl` IS the source of
 * truth (rendered server-side from the same React-PDF tree the user can
 * also live-preview from each section). This component now just embeds the
 * saved PDF and offers a download button — no more parallel form state.
 *
 * Editing has moved to the originating section (Quote/SalesOrder/Invoice/PO)
 * where users can change the underlying data and regenerate the document.
 */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, ShoppingCart } from "lucide-react";
import type { DocumentEditorProps } from "./types";

export function DocumentEditor(props: DocumentEditorProps) {
  const { document: doc, onClose } = props;

  const docType = doc?.documentType as string;
  const isPurchaseOrder = docType === "purchase_order";
  const isSalesOrder = docType === "sales_order";
  const isInvoice = docType === "invoice";

  const dialogTitle = isPurchaseOrder
    ? "Purchase Order"
    : isSalesOrder
      ? "Sales Order"
      : isInvoice
        ? "Invoice"
        : "Quote";

  const fileUrl: string | undefined = doc?.fileUrl;
  const fileName: string =
    doc?.fileName || `${dialogTitle.replace(/\s/g, "-")}-${doc?.documentNumber || "document"}.pdf`;

  // Cloudinary serves raw PDFs that some browsers refuse to display inline.
  // Google Docs Viewer wraps any same-/cross-origin PDF in an iframe-friendly
  // page. Cache buster so freshly-regenerated PDFs aren't served stale.
  const viewerSrc = fileUrl
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true&t=${Date.now()}`
    : null;

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            {isPurchaseOrder ? (
              <ShoppingCart className="w-5 h-5" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
            {dialogTitle} — {doc?.documentNumber || ""}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-gray-100">
          {viewerSrc ? (
            <iframe
              src={viewerSrc}
              title={`${dialogTitle} preview`}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No PDF file available for this document.
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-4 py-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {/* {fileUrl && (
            <Button asChild>
              <a href={fileUrl} download={fileName} target="_blank" rel="noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            </Button>
          )} */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
