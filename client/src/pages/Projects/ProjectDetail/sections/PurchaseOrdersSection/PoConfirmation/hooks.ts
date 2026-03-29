import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { POConfirmationData } from "./types";

export function usePoConfirmation() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [confirmNotes, setConfirmNotes] = useState("");

  const { data, isLoading, error } = useQuery<POConfirmationData>({
    queryKey: [`/api/po-confirmations/${token}`],
    enabled: !!token,
    retry: false,
  });

  const confirmMutation = useMutation({
    mutationFn: async (notes?: string) => {
      const response = await fetch(`/api/po-confirmations/${token}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error("Failed to confirm PO");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/po-confirmations/${token}`] });
      toast({ title: "PO Confirmed!", description: "Thank you for confirming this purchase order." });
    },
    onError: () => toast({ title: "Failed to confirm", variant: "destructive" }),
  });

  const declineMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await fetch(`/api/po-confirmations/${token}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to decline PO");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/po-confirmations/${token}`] });
      toast({ title: "PO Declined", description: "The distributor has been notified." });
    },
    onError: () => toast({ title: "Failed to decline", variant: "destructive" }),
  });

  const handleConfirm = () => {
    confirmMutation.mutate(confirmNotes || undefined);
  };

  const handleDecline = () => {
    declineMutation.mutate(declineReason);
  };

  const handleShowDeclineForm = () => setShowDeclineForm(true);
  const handleHideDeclineForm = () => setShowDeclineForm(false);

  return {
    data,
    isLoading,
    error,
    showDeclineForm,
    declineReason,
    setDeclineReason,
    confirmNotes,
    setConfirmNotes,
    confirmMutation,
    declineMutation,
    handleConfirm,
    handleDecline,
    handleShowDeclineForm,
    handleHideDeclineForm,
  };
}
