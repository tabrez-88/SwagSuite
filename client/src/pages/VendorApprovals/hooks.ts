import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTabParam } from "@/hooks/useTabParam";
import {
  useVendorApprovalRequests,
  useReviewVendorApprovalRequest,
} from "@/services/approvals";
import type { VendorApprovalRequest } from "./types";

export function useVendorApprovals() {
  const [selectedRequest, setSelectedRequest] = useState<VendorApprovalRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeTab, setActiveTab] = useTabParam("pending");
  const { toast } = useToast();

  const { data: requests = [], isLoading } = useVendorApprovalRequests<VendorApprovalRequest[]>();

  const _review = useReviewVendorApprovalRequest();
  const reviewMutation = {
    ..._review,
    mutate: (vars: { id: string; status: string; notes: string }) =>
      _review.mutate(
        { id: vars.id, status: vars.status, reviewNotes: vars.notes },
        {
          onSuccess: () => {
            toast({
              title: vars.status === "approved" ? "Request Approved" : "Request Rejected",
              description: `The vendor approval request has been ${vars.status}.`,
            });
            setIsReviewDialogOpen(false);
            setSelectedRequest(null);
            setReviewNotes("");
          },
          onError: (error: Error) =>
            toast({ title: "Error", description: error.message, variant: "destructive" }),
        },
      ),
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  const openReviewDialog = (request: VendorApprovalRequest) => {
    setSelectedRequest(request);
    setReviewNotes("");
    setIsReviewDialogOpen(true);
  };

  const handleReview = (status: "approved" | "rejected") => {
    if (!selectedRequest) return;
    reviewMutation.mutate({ id: selectedRequest.id, status, notes: reviewNotes });
  };

  const getUserDisplayName = (user?: VendorApprovalRequest["requestedByUser"]) => {
    if (!user) return "Unknown";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.username || user.email || "Unknown";
  };

  return {
    selectedRequest,
    isReviewDialogOpen,
    setIsReviewDialogOpen,
    reviewNotes,
    setReviewNotes,
    activeTab,
    setActiveTab,
    isLoading,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    reviewMutation,
    openReviewDialog,
    handleReview,
    getUserDisplayName,
  };
}
