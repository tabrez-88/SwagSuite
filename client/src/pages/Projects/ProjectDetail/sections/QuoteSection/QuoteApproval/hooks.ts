import { useState } from "react";
import { useRoute } from "@/lib/wouter-compat";
import { useToast } from "@/hooks/use-toast";
import {
  useClientApproval,
  useApproveClientDocument,
  useDeclineClientDocument,
} from "@/services/approvals";
import type { QuoteApprovalData } from "./types";

export function useQuoteApproval() {
  const [, newParams] = useRoute("/client-approval/:token");
  const [, legacyParams] = useRoute("/quote-approval/:token");
  const token = newParams?.token || legacyParams?.token;
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [pdfLoadKey, setPdfLoadKey] = useState(() => Date.now());

  const { data: approval, isLoading, error } = useClientApproval<QuoteApprovalData>(token);

  const isSalesOrder = approval?.documentType === "sales_order";
  const docLabel = isSalesOrder ? "Sales Order" : "Quote";

  const approveMutation = useApproveClientDocument(token ?? "");
  const declineMutation = useDeclineClientDocument(token ?? "");

  const handleApprove = () => {
    approveMutation.mutate(
      { notes: notes.trim() || undefined },
      {
        onSuccess: () =>
          toast({
            title: `${docLabel} Approved!`,
            description: "Thank you! Your order has been confirmed and will proceed to production.",
          }),
        onError: () =>
          toast({
            title: "Error",
            description: `Failed to approve ${docLabel.toLowerCase()}. Please try again.`,
            variant: "destructive",
          }),
      },
    );
  };

  const handleDecline = () => {
    if (!declineReason.trim()) {
      toast({
        title: "Reason Required",
        description: `Please provide a reason for declining the ${docLabel.toLowerCase()}.`,
        variant: "destructive",
      });
      return;
    }
    declineMutation.mutate(
      { reason: declineReason },
      {
        onSuccess: () =>
          toast({
            title: `${docLabel} Declined`,
            description: "Your feedback has been sent to the sales team. They will contact you shortly.",
          }),
        onError: (err: Error) =>
          toast({
            title: "Error",
            description: err.message || `Failed to decline ${docLabel.toLowerCase()}. Please try again.`,
            variant: "destructive",
          }),
      },
    );
  };

  const reloadPdfPreview = () => setPdfLoadKey(Date.now());

  return {
    notes,
    setNotes,
    declineReason,
    setDeclineReason,
    showDeclineForm,
    setShowDeclineForm,
    pdfLoadKey,
    approval,
    isLoading,
    error,
    isSalesOrder,
    docLabel,
    token,
    approveMutation,
    declineMutation,
    handleApprove,
    handleDecline,
    reloadPdfPreview,
  };
}
