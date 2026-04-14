import { useState } from "react";
import { useParams } from "@/lib/wouter-compat";
import { useToast } from "@/hooks/use-toast";
import {
  usePoConfirmation as usePoConfirmationQuery,
  useConfirmPurchaseOrder,
  useDeclinePurchaseOrder,
} from "@/services/approvals";
import type { POConfirmationData } from "./types";

export function usePoConfirmation() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [confirmNotes, setConfirmNotes] = useState("");

  const { data, isLoading, error } = usePoConfirmationQuery<POConfirmationData>(token);

  const confirmMutation = useConfirmPurchaseOrder(token ?? "");
  const declineMutation = useDeclinePurchaseOrder(token ?? "");

  const handleConfirm = () => {
    confirmMutation.mutate(confirmNotes || undefined, {
      onSuccess: () =>
        toast({ title: "PO Confirmed!", description: "Thank you for confirming this purchase order." }),
      onError: () => toast({ title: "Failed to confirm", variant: "destructive" }),
    });
  };

  const handleDecline = () => {
    declineMutation.mutate(declineReason, {
      onSuccess: () => toast({ title: "PO Declined", description: "The distributor has been notified." }),
      onError: () => toast({ title: "Failed to decline", variant: "destructive" }),
    });
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
