import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Build a fingerprint string for items + order-level fields to detect changes
export function buildItemsHash(items: any[], type: "quote" | "po", order?: any): string {
  const sorted = [...items].sort((a, b) => (a.id || "").localeCompare(b.id || ""));
  const itemsData = sorted.map((i) => ({
    id: i.id,
    qty: i.quantity,
    price: type === "quote" ? i.unitPrice : (i.cost || i.unitPrice),
  }));
  const orderFields = order
    ? type === "quote"
      ? { notes: order.notes || "", additionalInfo: order.additionalInformation || "", ihd: order.inHandsDate || "", eventDate: order.eventDate || "" }
      : { notes: order.notes || "", supplierNotes: order.supplierNotes || "", supplierIhd: order.supplierInHandsDate || "", isFirm: order.isFirm || false, isRush: order.isRush || false }
    : {};
  return JSON.stringify({ items: itemsData, ...orderFields });
}

interface GenerateDocumentParams {
  elementRef: HTMLDivElement | null;
  documentType: "quote" | "purchase_order";
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
  const poDocuments = documents.filter((d: any) => d.documentType === "purchase_order");

  // Generate PDF and upload
  const generateDocumentMutation = useMutation({
    mutationFn: async ({ elementRef, documentType, documentNumber, vendorId, vendorName, itemsHash }: GenerateDocumentParams) => {
      if (!elementRef) throw new Error("Template element not found");

      setIsGenerating(true);

      // Temporarily make element visible for capture
      const originalVisibility = elementRef.style.visibility;
      elementRef.style.visibility = "visible";

      await new Promise((resolve) => setTimeout(resolve, 200));

      const canvas = await html2canvas(elementRef, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        foreignObjectRendering: false,
      });

      elementRef.style.visibility = originalVisibility;

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Failed to capture document - canvas is empty");
      }

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pageHeight) {
        const scaleFactor = pageHeight / imgHeight;
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = pageHeight;
        const xOffset = (pageWidth - scaledWidth) / 2;
        pdf.addImage(imgData, "PNG", xOffset, 0, scaledWidth, scaledHeight);
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
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
    poDocuments,
    quoteApprovals,
    isGenerating,
    generateDocument,
    deleteDocument,
    createQuoteApproval: createQuoteApprovalMutation.mutateAsync,
    isDeleting: deleteDocumentMutation.isPending,
  };
}
