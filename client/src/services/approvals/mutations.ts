import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalKeys } from "./keys";
import * as requests from "./requests";

export function useApproveClientDocument(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { notes?: string }) => requests.approveClientDocument(token, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: approvalKeys.client(token) }),
  });
}

export function useDeclineClientDocument(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { reason: string }) => requests.declineClientDocument(token, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: approvalKeys.client(token) }),
  });
}

export function useConfirmPurchaseOrder(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => requests.confirmPurchaseOrder(token, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: approvalKeys.po(token) }),
  });
}

export function useDeclinePurchaseOrder(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => requests.declinePurchaseOrder(token, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: approvalKeys.po(token) }),
  });
}

export function useApproveArtwork(token: string, orderId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { comments?: string }) => requests.approveArtwork(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.artwork(token) });
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}/approvals`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}`] });
      }
    },
  });
}

export function useRejectArtwork(token: string, orderId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { comments: string }) => requests.rejectArtwork(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.artwork(token) });
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}/approvals`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}`] });
      }
    },
  });
}

export function useReviewVendorApprovalRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reviewNotes }: { id: string; status: string; reviewNotes?: string }) =>
      requests.reviewVendorApprovalRequest(id, { status, reviewNotes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: approvalKeys.vendorApprovals }),
  });
}

export function usePostPresentationComment(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { orderItemId: number; content: string; clientName: string }) =>
      requests.postPresentationComment(token, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: approvalKeys.publicPresentation(token) }),
  });
}
