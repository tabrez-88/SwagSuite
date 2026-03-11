import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { preloadAndConvertImages } from "@/lib/imageUtils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Build a fingerprint string for items + order-level fields to detect changes
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
  elementRef: HTMLDivElement | null;
  documentType: "quote" | "purchase_order" | "sales_order";
  documentNumber: string;
  vendorId?: string;
  vendorName?: string;
  itemsHash?: string;
}

export function useDocumentGeneration(orderId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch generated documents
  const { data: documents = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/documents`],
    enabled: !!orderId,
  });

  // Fetch quote approvals
  const { data: quoteApprovals = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/quote-approvals`],
    enabled: !!orderId,
  });

  const quoteDocuments = documents.filter((d: any) => d.documentType === "quote");
  const soDocuments = documents.filter((d: any) => d.documentType === "sales_order");
  const poDocuments = documents.filter((d: any) => d.documentType === "purchase_order");

  // Generate PDF and upload
  const generateDocumentMutation = useMutation({
    mutationFn: async ({ elementRef, documentType, documentNumber, vendorId, vendorName, itemsHash }: GenerateDocumentParams) => {
      if (!elementRef) throw new Error("Template element not found");

      setIsGenerating(true);

      // Temporarily make element visible for capture
      const originalVisibility = elementRef.style.visibility;
      elementRef.style.visibility = "visible";

      // Convert cross-origin images to base64 so html2canvas can capture them
      const restoreImages = await preloadAndConvertImages(elementRef);

      // Small delay to let the DOM settle after image replacement
      await new Promise((resolve) => setTimeout(resolve, 300));

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(elementRef, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: true,
          foreignObjectRendering: false,
        });
      } finally {
        // Restore original image src attributes
        restoreImages();
        elementRef.style.visibility = originalVisibility;
      }

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Failed to capture document - canvas is empty");
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight) {
        // Content fits on one page
        const imgData = canvas.toDataURL("image/png", 1.0);
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      } else {
        // Multi-page: split canvas into page-sized chunks
        const pxPerMm = canvas.width / pageWidth;
        const pageHeightPx = Math.floor(pageHeight * pxPerMm);
        const totalPages = Math.ceil(canvas.height / pageHeightPx);

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const sourceY = page * pageHeightPx;
          const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);
          if (sourceHeight <= 0) break;

          // Create a cropped canvas for this page
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const ctx = pageCanvas.getContext("2d");
          if (!ctx) continue;
          ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

          const pageImgData = pageCanvas.toDataURL("image/png", 1.0);
          const sliceHeightMm = (sourceHeight * pageWidth) / canvas.width;
          pdf.addImage(pageImgData, "PNG", 0, 0, pageWidth, sliceHeightMm);
        }
      }

      const pdfBlob = pdf.output("blob");

      const formData = new FormData();
      formData.append("pdf", pdfBlob, `${documentType}-${documentNumber}.pdf`);
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

      const response = await fetch(`/api/orders/${orderId}/documents`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to save document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/documents`] });
      setIsGenerating(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error generating document", description: error.message, variant: "destructive" });
      setIsGenerating(false);
    },
  });

  // Delete document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/documents`] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create quote approval
  const createQuoteApprovalMutation = useMutation({
    mutationFn: async (data: { clientEmail: string; clientName: string; documentId?: string; pdfPath?: string; quoteTotal?: string }) => {
      const response = await fetch(`/api/orders/${orderId}/quote-approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create quote approval");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/quote-approvals`] });
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
    quoteApprovals,
    isGenerating,
    generateDocument,
    deleteDocument,
    createQuoteApproval: createQuoteApprovalMutation.mutateAsync,
    isDeleting: deleteDocumentMutation.isPending,
  };
}
