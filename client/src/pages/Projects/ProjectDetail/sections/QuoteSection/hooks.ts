import { useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { useDocumentGeneration, buildItemsHash } from "@/hooks/useDocumentGeneration";
import { quoteStatuses } from "./types";
import type { QuoteSectionProps } from "./types";

export function useQuoteSection({ projectId, data, lockStatus }: QuoteSectionProps) {
  const { order, orderItems, quoteApprovals, companyName, primaryContact, contacts, allProducts, allArtworkItems } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  const {
    quoteDocuments,
    isGenerating,
    generateDocument,
    deleteDocument,
    createQuoteApproval,
    isDeleting,
  } = useDocumentGeneration(projectId);

  const enrichedItems = useMemo(() => {
    return orderItems.map((item: any) => {
      const product = allProducts.find((p: any) => p.id === item.productId);
      return {
        ...item,
        imageUrl: item.productImageUrl || product?.imageUrl || null,
      };
    });
  }, [orderItems, allProducts]);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PATCH", `/api/projects/${projectId}`, {
        quoteStatus: newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const currentQuoteHash = useMemo(() => {
    return buildItemsHash(orderItems, "quote", order);
  }, [orderItems, order]);

  const isQuoteStale = (doc: any) => {
    const storedHash = doc.metadata?.itemsHash;
    if (!storedHash) return false;
    return storedHash !== currentQuoteHash;
  };

  const handleGenerateQuote = async () => {
    if (!quoteRef.current || orderItems.length === 0) return;
    try {
      await generateDocument({
        elementRef: quoteRef.current,
        documentType: "quote",
        documentNumber: (order as any)?.orderNumber || "DRAFT",
        itemsHash: currentQuoteHash,
      });
      toast({ title: "Quote PDF generated successfully" });
    } catch {
      // Error handled by hook
    }
  };

  const handleRegenerateQuote = async (docId: string) => {
    await deleteDocument(docId);
    await new Promise((r) => setTimeout(r, 300));
    await handleGenerateQuote();
  };

  const handleGetApprovalLink = async (doc: any) => {
    const existingApproval = quoteApprovals.find((a: any) => a.status === "pending");
    if (existingApproval) {
      const approvalUrl = `${window.location.origin}/client-approval/${existingApproval.approvalToken}`;
      navigator.clipboard.writeText(approvalUrl);
      toast({ title: "Approval Link Copied", description: "The existing approval link has been copied to clipboard." });
      return;
    }
    try {
      const result = await createQuoteApproval({
        clientEmail: primaryContact?.email || "",
        clientName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName,
        documentId: doc.id,
        pdfPath: doc.fileUrl,
        quoteTotal: (order as any)?.total,
      });
      const approvalUrl = `${window.location.origin}/client-approval/${result.approvalToken}`;
      navigator.clipboard.writeText(approvalUrl);
      toast({ title: "Approval Link Generated", description: "Link copied to clipboard." });
    } catch {
      toast({ title: "Error", description: "Failed to generate approval link", variant: "destructive" });
    }
  };

  const currentStatus = (order as any)?.quoteStatus || "draft";
  const statusInfo = quoteStatuses.find((s) => s.value === currentStatus) || quoteStatuses[0];
  const isQuotePhase = currentStatus === "draft" || currentStatus === "sent";

  const totalItems = orderItems.length;
  const totalQty = orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  const subtotal = Number(order?.subtotal || 0);
  const tax = Number(order?.tax || 0);
  const shipping = Number(order?.shipping || 0);
  const total = subtotal + tax + shipping;

  const isLocked = lockStatus?.isLocked ?? false;
  const { updateField, isPending: isFieldPending } = useInlineEdit({ projectId, isLocked });

  const handleConversionSuccess = () => {
    setShowConversionDialog(false);
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/items`] });
  };

  const contactsList = (contacts || []).map((c: any) => ({
    id: String(c.id),
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    email: c.email,
    isPrimary: c.isPrimary,
    title: c.title,
    receiveOrderEmails: c.receiveOrderEmails,
  }));

  return {
    // Data
    order,
    orderItems,
    quoteApprovals,
    companyName,
    primaryContact,
    allArtworkItems,
    enrichedItems,
    contactsList,
    data,

    // Status
    currentStatus,
    statusInfo,
    isQuotePhase,
    isLocked,

    // Totals
    totalItems,
    totalQty,
    subtotal,
    tax,
    shipping,
    total,

    // Document generation
    quoteDocuments,
    isGenerating,
    isDeleting,
    quoteRef,
    deleteDocument,
    createQuoteApproval,

    // Inline edit
    updateField,
    isFieldPending,

    // Mutations
    updateStatusMutation,

    // Dialogs
    showConversionDialog,
    setShowConversionDialog,
    previewDocument,
    setPreviewDocument,
    showSendDialog,
    setShowSendDialog,

    // Handlers
    handleGenerateQuote,
    handleRegenerateQuote,
    handleGetApprovalLink,
    handleConversionSuccess,
    isQuoteStale,
  };
}
