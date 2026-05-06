import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBranding } from "@/services/settings";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateInvoice,
  useUpdateInvoiceDueDate,
  useUpdateInvoiceNotes,
  useRecordManualPayment,
  useCreateStripePayment,
  useCreateDepositInvoice,
  useCreateFinalInvoice,
  useVoidStripeInvoice,
  invoiceKeys,
} from "@/services/invoices";
import { differenceInDays } from "date-fns";
import { useDocumentGeneration, buildItemsHash } from "@/hooks/useDocumentGeneration";
import { buildInvoicePdf } from "@/components/documents/pdf/builders";
import { getEditedItem } from "@/lib/projectDetailUtils";
import type { GeneratedDocument } from "@shared/schema";
import type { InvoiceSectionProps } from "./types";

export function useInvoiceSection({ projectId, data }: InvoiceSectionProps) {
  const { order, invoice, invoiceLoading, orderItems, companyName, primaryContact, contacts, serviceCharges, allItemLines, allArtworkItems, allItemCharges, allArtworkCharges, assignedUser } = data;
  const { toast } = useToast();

  // State
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("check");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [notesInitialized, setNotesInitialized] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const { data: branding } = useBranding();

  // Document generation hook
  const { invoiceDocuments: allInvoiceDocuments, isGenerating, generateDocument, deleteDocument, isDeleting } = useDocumentGeneration(projectId);

  // Notes initialization moved below activeInvoice computation

  // Items hash for stale detection
  const currentItemsHash = useMemo(() => {
    if (!orderItems || orderItems.length === 0) return "";
    return buildItemsHash(orderItems, "quote", order);
  }, [orderItems, order]);

  // Invoice aging calculation — uses selectedInvoice (resolved below)
  // invoiceDocuments, latestInvoiceDoc, isDocStale computed after selectedInvoice

  // Mutations
  const createInvoiceMutation = useCreateInvoice(projectId);
  const createDepositInvoiceMutation = useCreateDepositInvoice(projectId);
  const createFinalInvoiceMutation = useCreateFinalInvoice(projectId);
  const updateDueDateMutation = useUpdateInvoiceDueDate(projectId);
  const updateNotesMutation = useUpdateInvoiceNotes(projectId);
  const manualPaymentMutation = useRecordManualPayment(projectId);
  const stripePaymentMutation = useCreateStripePayment(projectId);
  const voidStripeMutation = useVoidStripeInvoice(projectId);

  // Deposit helpers
  const hasDeposit = !!order?.depositPercent && Number(order.depositPercent) > 0;
  const depositReceived = order?.depositStatus === "received";

  // Multi-invoice awareness
  const { data: allInvoices } = useQuery<any[]>({
    queryKey: invoiceKeys.allByOrder(projectId),
    staleTime: Infinity,
  });

  const depositInvoice = useMemo(() => allInvoices?.find((inv) => inv.invoiceType === "deposit"), [allInvoices]);
  const finalInvoice = useMemo(() => allInvoices?.find((inv) => inv.invoiceType === "final"), [allInvoices]);
  const standardInvoice = useMemo(() => allInvoices?.find((inv) => inv.invoiceType === "standard" || !inv.invoiceType), [allInvoices]);

  // Active invoice: prefer final > deposit > standard > legacy single invoice
  const activeInvoice = finalInvoice ?? depositInvoice ?? standardInvoice ?? invoice;

  // Show create button when: no invoice at all, OR deposit is paid but no final invoice yet
  const showCreateButton = !activeInvoice || (depositInvoice?.status === "paid" && !finalInvoice);

  // Use activeInvoice for all UI rendering (replaces raw `invoice` from props)
  const displayInvoice = activeInvoice;

  // Auto-select active invoice on first load
  if (allInvoices && allInvoices.length > 0 && !selectedInvoiceId && activeInvoice?.id) {
    setSelectedInvoiceId(activeInvoice.id);
  }

  // Selected invoice for detail panel — always from allInvoices when available
  const selectedInvoice = useMemo(() => {
    if (!allInvoices || allInvoices.length === 0) return displayInvoice;
    if (selectedInvoiceId) {
      const found = allInvoices.find((inv) => inv.id === selectedInvoiceId);
      if (found) return found;
    }
    return displayInvoice;
  }, [allInvoices, selectedInvoiceId, displayInvoice]);

  const handleSelectInvoice = (id: number) => {
    setSelectedInvoiceId(id);
    // Reset notes initialization so notes reload for newly selected invoice
    setNotesInitialized(false);
  };

  // Initialize notes from the selected invoice
  if (selectedInvoice && !notesInitialized) {
    setInvoiceNotes(selectedInvoice.notes || "");
    setNotesInitialized(true);
  }

  // Filter documents for the selected invoice (no fallback — empty = "generate new")
  const invoiceDocuments = useMemo(() => {
    if (!selectedInvoice?.invoiceNumber) return allInvoiceDocuments;
    return allInvoiceDocuments.filter(
      (doc) => doc.documentNumber === selectedInvoice.invoiceNumber
    );
  }, [allInvoiceDocuments, selectedInvoice?.invoiceNumber]);

  const latestInvoiceDoc = invoiceDocuments.length > 0 ? invoiceDocuments[invoiceDocuments.length - 1] : null;
  const isDocStale = latestInvoiceDoc && currentItemsHash && latestInvoiceDoc.metadata?.itemsHash !== currentItemsHash;

  // Invoice aging calculation
  const agingInfo = useMemo(() => {
    if (!selectedInvoice?.dueDate || selectedInvoice.status === "paid" || selectedInvoice.status === "cancelled") return null;
    const daysOverdue = differenceInDays(new Date(), new Date(selectedInvoice.dueDate));
    if (daysOverdue <= 0) return null;
    let category: string;
    let colorClass: string;
    if (daysOverdue <= 30) {
      category = "1-30 days";
      colorClass = "text-yellow-700 bg-yellow-50 border-yellow-200";
    } else if (daysOverdue <= 60) {
      category = "31-60 days";
      colorClass = "text-orange-700 bg-orange-50 border-orange-200";
    } else if (daysOverdue <= 90) {
      category = "61-90 days";
      colorClass = "text-red-600 bg-red-50 border-red-200";
    } else {
      category = "90+ days";
      colorClass = "text-red-800 bg-red-100 border-red-300";
    }
    return { daysOverdue, category, colorClass };
  }, [selectedInvoice?.dueDate, selectedInvoice?.status]);

  const buildInvoiceDoc = () =>
    buildInvoicePdf({
      invoice: { ...selectedInvoice, notes: invoiceNotes },
      order,
      orderItems,
      companyName,
      primaryContact,
      allItemLines,
      allArtworkItems,
      allItemCharges,
      allArtworkCharges,
      serviceCharges,
      assignedUser,
      sellerName: branding?.companyName ?? undefined,
      logoUrl: branding?.logoUrl ?? undefined,
    });

  // Generate local PDF
  const handleGeneratePdf = async () => {
    if (!selectedInvoice) return;
    try {
      await generateDocument({
        pdfDocument: buildInvoiceDoc(),
        documentType: "invoice",
        documentNumber: selectedInvoice.invoiceNumber,
        itemsHash: currentItemsHash,
      });
      toast({ title: "Invoice PDF generated" });
    } catch (err) {
      // Error handled by hook
    }
  };

  const handlePreviewLive = () => setShowLivePreview(true);

  // Derived values
  const hasStripePdf = !!selectedInvoice?.stripeInvoicePdfUrl;
  const hasStripeInvoice = !!selectedInvoice?.stripeInvoiceId;
  const hasLocalPdf = invoiceDocuments.length > 0;

  // Determine which PDF to use for sending
  const sendableDocument = latestInvoiceDoc
    ? { fileUrl: latestInvoiceDoc.fileUrl, id: latestInvoiceDoc.id }
    : hasStripePdf
      ? { fileUrl: selectedInvoice?.stripeInvoicePdfUrl, id: selectedInvoice?.stripeInvoiceId || "" }
      : null;

  // Handlers
  const handleDueDateChange = (value: string) => {
    if (value) {
      updateDueDateMutation.mutate(value);
    }
  };

  const handleNotesChange = (value: string) => {
    setInvoiceNotes(value);
  };

  const handleNotesBlur = () => {
    if (selectedInvoice && invoiceNotes !== (selectedInvoice.notes || "")) {
      updateNotesMutation.mutate(invoiceNotes);
    }
  };

  const handleCopyPaymentLink = () => {
    if (selectedInvoice?.stripeInvoiceUrl) {
      navigator.clipboard.writeText(selectedInvoice.stripeInvoiceUrl);
      toast({ title: "Payment link copied to clipboard" });
    }
  };

  const handleStripePayment = () => {
    if (!selectedInvoice) return;
    stripePaymentMutation.mutate(selectedInvoice.id, {
      onSuccess: (data: { paymentLink?: string }) => {
        if (data.paymentLink) {
          navigator.clipboard.writeText(data.paymentLink);
          toast({ title: "Payment link copied to clipboard", description: "Invoice PDF is now available from Stripe." });
        }
      },
    });
  };

  const handleOpenPaymentDialog = () => {
    if (selectedInvoice) {
      setPaymentAmount(String(selectedInvoice.totalAmount || ""));
      setShowPaymentDialog(true);
    }
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice) return;
    manualPaymentMutation.mutate(
      {
        invoiceId: selectedInvoice.id,
        data: {
          paymentMethod,
          paymentReference,
          amount: paymentAmount || selectedInvoice.totalAmount,
        },
      },
      {
        onSuccess: () => {
          setShowPaymentDialog(false);
          setPaymentMethod("check");
          setPaymentReference("");
          setPaymentAmount("");
        },
      },
    );
  };

  const handleVoidStripe = () => {
    if (!selectedInvoice?.id) return;
    voidStripeMutation.mutate(selectedInvoice.id);
  };

  const handleDeleteDocument = (docId: number | string) => {
    return deleteDocument(String(docId));
  };

  // Formatted contacts for SendInvoiceDialog
  const formattedContacts = (contacts || []).map((c) => ({
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
    invoice: selectedInvoice,
    invoiceLoading,
    orderItems,
    companyName,
    primaryContact,
    serviceCharges,
    formattedContacts,

    // Document state
    invoiceDocuments,
    buildInvoiceDoc,
    showLivePreview,
    setShowLivePreview,
    handlePreviewLive,
    latestInvoiceDoc,
    isDocStale,
    isGenerating,
    isDeleting,
    hasStripePdf,
    hasStripeInvoice,
    hasLocalPdf,
    sendableDocument,
    previewDoc,
    setPreviewDoc,

    // Invoice state
    invoiceNotes,
    agingInfo,

    // Dialog state
    showSendDialog,
    setShowSendDialog,
    showPaymentDialog,
    setShowPaymentDialog,

    // Payment form state
    paymentMethod,
    setPaymentMethod,
    paymentReference,
    setPaymentReference,
    paymentAmount,
    setPaymentAmount,

    // Mutations
    createInvoiceMutation,
    createDepositInvoiceMutation,
    createFinalInvoiceMutation,
    stripePaymentMutation,
    voidStripeMutation,
    manualPaymentMutation,

    // Deposit
    hasDeposit,
    depositReceived,
    depositInvoice,
    finalInvoice,
    allInvoices,
    showCreateButton,
    selectedInvoiceId,
    handleSelectInvoice,

    // Handlers
    handleGeneratePdf,
    handleDueDateChange,
    handleNotesChange,
    handleNotesBlur,
    handleCopyPaymentLink,
    handleStripePayment,
    handleOpenPaymentDialog,
    handleRecordPayment,
    handleVoidStripe,
    handleDeleteDocument,

    // Utilities
    getEditedItem,
  };
}
