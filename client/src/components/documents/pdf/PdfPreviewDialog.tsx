/**
 * Generic PDF preview dialog backed by `<PDFViewer>` from @react-pdf/renderer.
 *
 * Replaces the old html2canvas + Google Docs Viewer iframe path with a true,
 * live, in-browser PDF render of any react-pdf `<Document>`. Because the
 * preview is the same component used to generate the saved file, what the
 * user sees here is byte-for-byte what the recipient will receive.
 *
 * Use this for ad-hoc previews of an unsaved document. For previewing a
 * document that has already been saved to Cloudinary, just open the
 * `fileUrl` directly.
 */
import type { ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PDFViewer } from "@react-pdf/renderer";

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** A `<QuotePdf />`, `<SalesOrderPdf />`, etc. element to render live. */
  document: ReactElement | null;
}

export function PdfPreviewDialog({
  open,
  onOpenChange,
  title,
  document,
}: PdfPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[50vw] w-[50vw] h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 bg-gray-100">
          {open && document && (
            <PDFViewer
              width="100%"
              height="100%"
              style={{ border: "none" }}
              showToolbar
            >
              {document as any}
            </PDFViewer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
