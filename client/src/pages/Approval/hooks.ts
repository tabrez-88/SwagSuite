import { useState, useRef, useCallback } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ApprovalData } from "./types";

export function useApproval() {
  const [, params] = useRoute("/approval/:token");
  const token = params?.token;
  const { toast } = useToast();
  const [comments, setComments] = useState("");
  const queryClient = useQueryClient();

  // Image zoom state
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // View state: 'proof' or 'original'
  const [viewMode, setViewMode] = useState<"proof" | "original">("proof");

  const { data: approval, isLoading, error } = useQuery<ApprovalData>({
    queryKey: [`/api/approvals/${token}`],
    enabled: !!token,
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: async (data: { comments?: string }) => {
      const response = await fetch(`/api/approvals/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to approve artwork");
      return response.json();
    },
    onSuccess: () => {
      if (approval?.orderId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${approval.orderId}/approvals`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${approval.orderId}`] });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/approvals/${token}`] });
      toast({
        title: "Artwork Approved!",
        description: "Thank you! The artwork has been approved and production will begin.",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve artwork. Please try again.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { comments: string }) => {
      const response = await fetch(`/api/approvals/${token}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to reject artwork");
      return response.json();
    },
    onSuccess: () => {
      if (approval?.orderId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${approval.orderId}/approvals`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${approval.orderId}`] });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/approvals/${token}`] });
      toast({
        title: "Feedback Submitted",
        description: "We've received your feedback and will revise the artwork.",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit feedback. Please try again.", variant: "destructive" });
    },
  });

  const handleApprove = useCallback(() => {
    approveMutation.mutate({ comments: comments || undefined });
  }, [approveMutation, comments]);

  const handleReject = useCallback(() => {
    if (!comments.trim()) {
      toast({ title: "Comments Required", description: "Please provide feedback about what needs to be changed.", variant: "destructive" });
      return;
    }
    rejectMutation.mutate({ comments });
  }, [rejectMutation, comments, toast]);

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 0.25, 5)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 0.25, 0.25)), []);
  const handleResetZoom = useCallback(() => { setZoom(1); setRotation(0); }, []);
  const handleRotate = useCallback(() => setRotation(r => (r + 90) % 360), []);
  const toggleFullscreen = useCallback(() => setIsFullscreen(f => !f), []);

  // Get the proof image URL — use vendor proof from artworkDetails if available
  const getProofImageUrl = useCallback(() => {
    if (approval?.artworkFile?.filePath) return approval.artworkFile.filePath;
    if (approval?.artworkUrl) return approval.artworkUrl;
    const withProof = approval?.artworkDetails?.find(a => a.proofFilePath);
    if (withProof?.proofFilePath) return withProof.proofFilePath;
    const withFile = approval?.artworkDetails?.find(a => a.filePath);
    if (withFile?.filePath) return withFile.filePath;
    return null;
  }, [approval]);

  const getOriginalImageUrl = useCallback(() => {
    const withFile = approval?.artworkDetails?.find(a => a.filePath);
    return withFile?.filePath || null;
  }, [approval]);

  const currentImageUrl = viewMode === "proof" ? getProofImageUrl() : getOriginalImageUrl();
  const hasOriginal = !!getOriginalImageUrl();
  const hasProof = !!getProofImageUrl();

  const isApproved = approval?.status === "approved";
  const isRejected = approval?.status === "rejected" || approval?.status === "declined";
  const isPending = approval?.status === "pending";
  const artworkDetails = approval?.artworkDetails || [];
  const approvalHistory = approval?.approvalHistory || [];

  return {
    // Data
    approval,
    isLoading,
    error,
    artworkDetails,
    approvalHistory,

    // Status flags
    isApproved,
    isRejected,
    isPending,

    // Image state
    zoom,
    isFullscreen,
    rotation,
    viewMode,
    setViewMode,
    imageContainerRef,
    currentImageUrl,
    hasOriginal,
    hasProof,

    // Form state
    comments,
    setComments,

    // Mutations
    approveMutation,
    rejectMutation,

    // Handlers
    handleApprove,
    handleReject,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleRotate,
    toggleFullscreen,
  };
}
