import { useState, useCallback, type ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { pdf } from "@react-pdf/renderer";
import { uploadDocument, deleteDocument as deleteDocumentRequest, createQuoteApproval } from "@/services/documents/requests";

// Build a fingerprint string for items + order-level fields to detect changes.
// Stored in document metadata so we can flag stale PDFs after edits.
export function buildItemsHash(items: any[], type: "quote" | "po" | "sales_order", order?: any): string {
  const sorted = [...items].sort((a, b) => (a.id || "").localeCompare(b.id || ""));
  const itemsData = sorted.map((i) => ({
    id: i.id,
    qty: i.quantity,
    price: type === "quote" || type === "sales_order" ? i.unitPrice : (i.cost || i.unitPrice),
  }));
  const orderFields = order
    ? type === "quote"
      ? { notes: order.notes || "", additionalInfo: order.additionalInformation || "", ihd: order.inHandsDate || "", eventDate: order.eventDate || "" }
      : type === "sales_order"
        ? { notes: order.notes || "", ihd: order.inHandsDate || "", eventDate: order.eventDate || "", billing: order.billingAddress || "", shipping: order.shippingAddress || "" }
        : { notes: order.notes || "", supplierNotes: order.supplierNotes || "", supplierIhd: order.supplierInHandsDate || "", isFirm: order.isFirm || false, isRush: order.isRush || false }
    : {};
  return JSON.stringify({ items: itemsData, ...orderFields });
}

interface GenerateDocumentParams {
  /**
   * A react-pdf `<Document>` element (e.g. `<QuotePdf {...props} />`).
   * Will be rendered to a Blob via `pdf().toBlob()` — no DOM mounting needed,
   * runs entirely in the browser.
   */
  pdfDocument: ReactElement;
  documentType: "quote" | "purchase_order" | "sales_order" | "invoice";
  documentNumber: string;
  vendorId?: string;
  vendorName?: string;
  itemsHash?: string;
}

/**
 * Render a react-pdf Document to a Blob suitable for upload. Exposed as a
 * standalone helper so DocumentEditor's "Download" button can reuse it
 * without going through the mutation.
 */
export async function renderPdfBlob(pdfDocument: ReactElement): Promise<Blob> {
  // `pdf()` returns an instance with a `toBlob()` method. Type cast keeps
  // TS happy across react-pdf versions where the signature varies slightly.
  const instance = pdf(pdfDocument as any);
  return instance.toBlob();
}

export function useDocumentGeneration(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/documents`],
    enabled: !!projectId,
  });

  const { data: quoteApprovals = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/quote-approvals`],
    enabled: !!projectId,
  });

  const quoteDocuments = documents.filter((d: any) => d.documentType === "quote");
  const soDocuments = documents.filter((d: any) => d.documentType === "sales_order");
  const poDocuments = documents.filter((d: any) => d.documentType === "purchase_order");
  const invoiceDocuments = documents.filter((d: any) => d.documentType === "invoice");

  const generateDocumentMutation = useMutation({
    mutationFn: async ({
      pdfDocument,
      documentType,
      documentNumber,
      vendorId,
      vendorName,
      itemsHash,
    }: GenerateDocumentParams) => {
      setIsGenerating(true);

      // Render the React-PDF tree directly to a Blob — no DOM mounting,
      // no html2canvas raster step. Output is a true vector PDF.
      const pdfBlob = await renderPdfBlob(pdfDocument);

      const formData = new FormData();
      const typeLabel = documentType.replace(/_/g, "-").replace(/\b\w/g, (c: string) => c.toUpperCase());
      formData.append("pdf", pdfBlob, `${typeLabel}-${documentNumber}.pdf`);
      formData.append("documentType", documentType);
      formData.append("documentNumber", documentNumber);
      formData.append("vendorId", vendorId || "");
      formData.append("vendorName", vendorName || "");
      formData.append("status", "draft");

      const metadata = {
        orderNumber: documentNumber,
        generatedAt: new Date().toISOString(),
        itemsHash: itemsHash || "",
      };
      formData.append("metadata", JSON.stringify(metadata));

      return uploadDocument(projectId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/documents`] });
      setIsGenerating(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error generating document", description: error.message, variant: "destructive" });
      setIsGenerating(false);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => deleteDocumentRequest(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/documents`] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createQuoteApprovalMutation = useMutation({
    mutationFn: (data: { clientEmail: string; clientName: string; documentId?: string; pdfPath?: string; quoteTotal?: string }) =>
      createQuoteApproval(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/quote-approvals`] });
    },
  });

  const generateDocument = useCallback(
    async (params: GenerateDocumentParams) => {
      return generateDocumentMutation.mutateAsync(params);
    },
    [generateDocumentMutation]
  );

  const deleteDocument = useCallback(
    async (documentId: string) => {
      return deleteDocumentMutation.mutateAsync(documentId);
    },
    [deleteDocumentMutation]
  );

  return {
    documents,
    quoteDocuments,
    soDocuments,
    poDocuments,
    invoiceDocuments,
    quoteApprovals,
    isGenerating,
    generateDocument,
    deleteDocument,
    createQuoteApproval: createQuoteApprovalMutation.mutateAsync,
    isDeleting: deleteDocumentMutation.isPending,
  };
}
