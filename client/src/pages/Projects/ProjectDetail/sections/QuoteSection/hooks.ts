import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { useDocumentGeneration, buildItemsHash } from "@/hooks/useDocumentGeneration";
import { buildQuotePdf } from "@/components/documents/pdf/builders";
import { projectKeys } from "@/services/projects/keys";
import { useUpdateProjectStatus } from "@/services/projects/mutations";
import { useBranding } from "@/services/settings";
import { quoteStatuses } from "./types";
import type { EnrichedOrderItem } from "@/types/project-types";
import type { GeneratedDocument } from "@shared/schema";
import type { QuoteSectionProps } from "./types";

export function useQuoteSection({ projectId, data, lockStatus }: QuoteSectionProps) {
  const { order, orderItems, quoteApprovals, companyName, primaryContact, contacts, allProducts, allArtworkItems } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<GeneratedDocument | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const { data: branding } = useBranding();

  const {
    quoteDocuments,
    isGenerating,
    generateDocument,
    deleteDocument,
    createQuoteApproval,
    isDeleting,
  } = useDocumentGeneration(projectId);

  const enrichedItems = useMemo(() => {
    return orderItems.map((item) => {
      const product = allProducts.find((p) => p.id === item.productId);
      return {
        ...item,
        imageUrl: item.productImageUrl || product?.imageUrl || null,
      };
    });
  }, [orderItems, allProducts]);

  const _updateStatus = useUpdateProjectStatus(projectId);
  const updateStatusMutation = useMemo(() => ({
    ..._updateStatus,
    mutate: (newStatus: string) => _updateStatus.mutate({ quoteStatus: newStatus }),
  }), [_updateStatus]);

  const currentQuoteHash = useMemo(() => {
    return buildItemsHash(orderItems, "quote", order);
  }, [orderItems, order]);

  const isQuoteStale = (doc: GeneratedDocument) => {
    const storedHash = (doc.metadata as Record<string, unknown>)?.itemsHash;
    if (!storedHash) return false;
    return storedHash !== currentQuoteHash;
  };

  // Build the react-pdf Document element on demand. Reused for both saving
  // (passed to generateDocument) and live preview (PdfPreviewDialog).
  const buildQuoteDoc = () =>
    buildQuotePdf({
      order,
      orderItems,
      companyName,
      primaryContact,
      allItemLines: data.allItemLines,
      allArtworkItems,
      allItemCharges: data.allItemCharges,
      allArtworkCharges: data.allArtworkCharges,
      serviceCharges: data.serviceCharges,
      assignedUser: data.assignedUser,
      sellerName: branding?.companyName ?? undefined,
    });

  const handleGenerateQuote = async () => {
    if (orderItems.length === 0) return;
    try {
      await generateDocument({
        pdfDocument: buildQuoteDoc(),
        documentType: "quote",
        documentNumber: order?.orderNumber || "DRAFT",
        itemsHash: currentQuoteHash,
      });
      toast({ title: "Quote PDF generated successfully" });
    } catch {
      // Error handled by hook
    }
  };

  const handlePreviewLive = () => setShowLivePreview(true);

  const handleRegenerateQuote = async (docId: string) => {
    await deleteDocument(docId);
    await new Promise((r) => setTimeout(r, 300));
    await handleGenerateQuote();
  };

  const handleGetApprovalLink = async (doc: GeneratedDocument) => {
    const existingApproval = quoteApprovals.find((a) => a.status === "pending");
    if (existingApproval) {
      const approvalUrl = `${window.location.origin}/client-approval/${existingApproval.approvalToken}`;
      window.open(approvalUrl, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const result = await createQuoteApproval({
        clientEmail: primaryContact?.email || "",
        clientName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName,
        documentId: doc.id,
        pdfPath: doc.fileUrl ?? undefined,
        quoteTotal: order?.total ?? undefined,
      });
      const approvalUrl = `${window.location.origin}/client-approval/${result.approvalToken}`;
      window.open(approvalUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: "Error", description: "Failed to generate approval link", variant: "destructive" });
    }
  };

  const currentStatus = order?.quoteStatus || "draft";
  const statusInfo = quoteStatuses.find((s) => s.value === currentStatus) || quoteStatuses[0];
  const isQuotePhase = currentStatus === "draft" || currentStatus === "sent";

  const totalItems = orderItems.length;
  const totalQty = orderItems.reduce((sum: number, item) => sum + (item.quantity || 0), 0);
  const subtotal = Number(order?.subtotal || 0);
  const tax = Number(order?.tax || 0);
  const shipping = Number(order?.shipping || 0);
  const total = subtotal + tax + shipping;

  const isLocked = lockStatus?.isLocked ?? false;
  const { updateField, isPending: isFieldPending } = useInlineEdit({ projectId, isLocked });

  const handleConversionSuccess = () => {
    setShowConversionDialog(false);
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) });
  };

  const contactsList = (contacts || []).map((c) => ({
    id: String(c.id),
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    email: c.email ?? null,
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
    deleteDocument,
    createQuoteApproval,
    buildQuoteDoc,
    branding,

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
    showLivePreview,
    setShowLivePreview,

    // Handlers
    handleGenerateQuote,
    handleRegenerateQuote,
    handleGetApprovalLink,
    handleConversionSuccess,
    handlePreviewLive,
    isQuoteStale,
  };
}
