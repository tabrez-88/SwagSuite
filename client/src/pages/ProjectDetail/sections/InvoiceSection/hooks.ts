import { useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateInvoice,
  useUpdateInvoiceDueDate,
  useUpdateInvoiceNotes,
  useRecordManualPayment,
  useCreateStripePayment,
} from "@/services/invoices";
import { differenceInDays } from "date-fns";
import { useDocumentGeneration, buildItemsHash } from "@/hooks/useDocumentGeneration";
import type { InvoiceSectionProps } from "./types";

function getEditedItem(_id: string, item: any) {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productSku: item.productSku,
    supplierId: item.supplierId,
    color: item.color || "",
    quantity: item.quantity || 0,
    unitPrice: parseFloat(item.unitPrice) || 0,
    cost: parseFloat(item.cost || 0),
    decorationCost: parseFloat(item.decorationCost || 0),
    charges: parseFloat(item.charges || 0),
    margin: 44,
    sizePricing: item.sizePricing || {},
  };
}

export function useInvoiceSection({ orderId, data }: InvoiceSectionProps) {
  const { order, invoice, invoiceLoading, orderItems, companyName, primaryContact, contacts, serviceCharges } = data;
  const { toast } = useToast();

  // State
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("check");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [notesInitialized, setNotesInitialized] = useState(false);

  const templateRef = useRef<HTMLDivElement>(null);

  // Document generation hook
  const { invoiceDocuments, isGenerating, generateDocument, deleteDocument, isDeleting } = useDocumentGeneration(orderId);

  // Initialize notes from invoice data
  if (invoice && !notesInitialized) {
    setInvoiceNotes((invoice as any).notes || "");
    setNotesInitialized(true);
  }

  // Items hash for stale detection
  const currentItemsHash = useMemo(() => {
    if (!orderItems || orderItems.length === 0) return "";
    return buildItemsHash(orderItems, "quote", order);
  }, [orderItems, order]);

  // Check if latest invoice document is stale
  const latestInvoiceDoc = invoiceDocuments.length > 0 ? invoiceDocuments[invoiceDocuments.length - 1] : null;
  const isDocStale = latestInvoiceDoc && currentItemsHash && latestInvoiceDoc.metadata?.itemsHash !== currentItemsHash;

  // Invoice aging calculation
  const agingInfo = useMemo(() => {
    if (!invoice?.dueDate || invoice.status === "paid" || invoice.status === "cancelled") return null;
    const daysOverdue = differenceInDays(new Date(), new Date(invoice.dueDate));
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
  }, [invoice?.dueDate, invoice?.status]);

  // Mutations
  const createInvoiceMutation = useCreateInvoice(orderId);
  const updateDueDateMutation = useUpdateInvoiceDueDate(orderId);
  const updateNotesMutation = useUpdateInvoiceNotes(orderId);
  const manualPaymentMutation = useRecordManualPayment(orderId);
  const stripePaymentMutation = useCreateStripePayment(orderId);

  // Generate local PDF
  const handleGeneratePdf = async () => {
    if (!invoice || !templateRef.current) return;
    try {
      await generateDocument({
        elementRef: templateRef.current,
        documentType: "invoice",
        documentNumber: invoice.invoiceNumber,
        itemsHash: currentItemsHash,
      });
      toast({ title: "Invoice PDF generated" });
    } catch (err) {
      // Error handled by hook
    }
  };

  // Derived values
  const hasStripePdf = !!invoice?.stripeInvoicePdfUrl;
  const hasStripeInvoice = !!invoice?.stripeInvoiceId;
  const hasLocalPdf = invoiceDocuments.length > 0;

  // Determine which PDF to use for sending
  const sendableDocument = latestInvoiceDoc
    ? { fileUrl: latestInvoiceDoc.filePath, id: latestInvoiceDoc.id }
    : hasStripePdf
      ? { fileUrl: invoice?.stripeInvoicePdfUrl, id: invoice?.stripeInvoiceId || "" }
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
    if (invoiceNotes !== ((invoice as any).notes || "")) {
      updateNotesMutation.mutate(invoiceNotes);
    }
  };

  const handleCopyPaymentLink = () => {
    if (invoice?.stripeInvoiceUrl) {
      navigator.clipboard.writeText(invoice.stripeInvoiceUrl);
      toast({ title: "Payment link copied to clipboard" });
    }
  };

  const handleStripePayment = () => {
    if (!invoice) return;
    stripePaymentMutation.mutate(invoice.id, {
      onSuccess: (data: any) => {
        if (data.paymentLink) {
          navigator.clipboard.writeText(data.paymentLink);
          toast({ title: "Payment link copied to clipboard", description: "Invoice PDF is now available from Stripe." });
        }
      },
    });
  };

  const handleOpenPaymentDialog = () => {
    if (invoice) {
      setPaymentAmount(String(invoice.totalAmount || ""));
      setShowPaymentDialog(true);
    }
  };

  const handleRecordPayment = () => {
    if (!invoice) return;
    manualPaymentMutation.mutate(
      {
        invoiceId: invoice.id,
        data: {
          paymentMethod,
          paymentReference,
          amount: paymentAmount || invoice.totalAmount,
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

  const handleDeleteDocument = (docId: number | string) => {
    return deleteDocument(String(docId));
  };

  // Formatted contacts for SendInvoiceDialog
  const formattedContacts = (contacts || []).map((c: any) => ({
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
    invoice,
    invoiceLoading,
    orderItems,
    companyName,
    primaryContact,
    serviceCharges,
    formattedContacts,

    // Document state
    templateRef,
    invoiceDocuments,
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
    stripePaymentMutation,
    manualPaymentMutation,

    // Handlers
    handleGeneratePdf,
    handleDueDateChange,
    handleNotesChange,
    handleNotesBlur,
    handleCopyPaymentLink,
    handleStripePayment,
    handleOpenPaymentDialog,
    handleRecordPayment,
    handleDeleteDocument,

    // Utilities
    getEditedItem,
  };
}
