import { useState, useRef, useCallback } from "react";
import { useRoute } from "@/lib/wouter-compat";
import { useToast } from "@/hooks/use-toast";
import {
  useArtworkApproval,
  useApproveArtwork,
  useRejectArtwork,
} from "@/services/approvals";
import type { ApprovalData } from "./types";

export function useApproval() {
  const [, params] = useRoute("/approval/:token");
  const token = params?.token;
  const { toast } = useToast();
  const [comments, setComments] = useState("");

  // Image zoom state
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // View state: 'proof' or 'original'
  const [viewMode, setViewMode] = useState<"proof" | "original">("proof");

  const { data: approval, isLoading, error } = useArtworkApproval<ApprovalData>(token);

  const approveMutation = useApproveArtwork(token ?? "", approval?.orderId);
  const rejectMutation = useRejectArtwork(token ?? "", approval?.orderId);

  const handleApprove = useCallback(() => {
    approveMutation.mutate(
      { comments: comments || undefined },
      {
        onSuccess: () =>
          toast({
            title: "Artwork Approved!",
            description: "Thank you! The artwork has been approved and production will begin.",
          }),
        onError: () =>
          toast({ title: "Error", description: "Failed to approve artwork. Please try again.", variant: "destructive" }),
      },
    );
  }, [approveMutation, comments, toast]);

  const handleReject = useCallback(() => {
    if (!comments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide feedback about what needs to be changed.",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate(
      { comments },
      {
        onSuccess: () =>
          toast({
            title: "Feedback Submitted",
            description: "We've received your feedback and will revise the artwork.",
          }),
        onError: () =>
          toast({ title: "Error", description: "Failed to submit feedback. Please try again.", variant: "destructive" }),
      },
    );
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
    approval,
    isLoading,
    error,
    artworkDetails,
    approvalHistory,
    isApproved,
    isRejected,
    isPending,
    zoom,
    isFullscreen,
    rotation,
    viewMode,
    setViewMode,
    imageContainerRef,
    currentImageUrl,
    hasOriginal,
    hasProof,
    comments,
    setComments,
    approveMutation,
    rejectMutation,
    handleApprove,
    handleReject,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleRotate,
    toggleFullscreen,
  };
}
