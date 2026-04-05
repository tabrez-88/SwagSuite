import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTabParam } from "@/hooks/useTabParam";
import type { VendorApprovalRequest } from "./types";

export function useVendorApprovals() {
  const [selectedRequest, setSelectedRequest] = useState<VendorApprovalRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeTab, setActiveTab] = useTabParam("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<VendorApprovalRequest[]>({
    queryKey: ["/api/vendor-approvals"],
    queryFn: async () => {
      const response = await fetch("/api/vendor-approvals", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch approval requests");
      return response.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const response = await fetch(`/api/vendor-approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update request");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === "approved" ? "Request Approved" : "Request Rejected",
        description: `The vendor approval request has been ${variables.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-approvals"] });
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
    reviewMutation.mutate({
      id: selectedRequest.id,
      status,
      notes: reviewNotes,
    });
  };

  const getUserDisplayName = (user?: VendorApprovalRequest["requestedByUser"]) => {
    if (!user) return "Unknown";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.username || user.email || "Unknown";
  };

  return {
    // State
    selectedRequest,
    isReviewDialogOpen,
    setIsReviewDialogOpen,
    reviewNotes,
    setReviewNotes,
    activeTab,
    setActiveTab,
    // Data
    isLoading,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    // Mutations
    reviewMutation,
    // Handlers
    openReviewDialog,
    handleReview,
    getUserDisplayName,
  };
}
