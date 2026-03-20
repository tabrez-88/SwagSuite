import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
  const queryClient = useQueryClient();

  // Fetch quote approval data
  const { data: approval, isLoading, error } = useQuery<QuoteApprovalData>({
    queryKey: [`/api/client-approvals/${token}`],
    enabled: !!token,
    retry: false,
  });

  const isSalesOrder = approval?.documentType === "sales_order";
  const docLabel = isSalesOrder ? "Sales Order" : "Quote";

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (data: { notes?: string }) => {
      const response = await fetch(`/api/client-approvals/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to approve ${docLabel.toLowerCase()}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client-approvals/${token}`] });
      toast({
        title: `${docLabel} Approved!`,
        description: "Thank you! Your order has been confirmed and will proceed to production.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to approve ${docLabel.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: async (data: { reason: string }) => {
      const response = await fetch(`/api/client-approvals/${token}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to decline ${docLabel.toLowerCase()}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client-approvals/${token}`] });
      toast({
        title: `${docLabel} Declined`,
        description: "Your feedback has been sent to the sales team. They will contact you shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to decline ${docLabel.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({ notes: notes.trim() || undefined });
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
    declineMutation.mutate({ reason: declineReason });
  };

  const reloadPdfPreview = () => setPdfLoadKey(Date.now());

  return {
    // State
    notes,
    setNotes,
    declineReason,
    setDeclineReason,
    showDeclineForm,
    setShowDeclineForm,
    pdfLoadKey,

    // Query
    approval,
    isLoading,
    error,

    // Computed
    isSalesOrder,
    docLabel,
    token,

    // Mutations
    approveMutation,
    declineMutation,

    // Handlers
    handleApprove,
    handleDecline,
    reloadPdfPreview,
  };
}
