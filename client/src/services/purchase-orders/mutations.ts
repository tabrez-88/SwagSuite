import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrderKeys } from "./keys";
import * as requests from "./requests";
import type { CreatePurchaseOrderData, UpdatePurchaseOrderData } from "./types";

function useInvalidate(orderId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.byOrder(orderId) });
}

export function useCreatePurchaseOrder(orderId: string) {
  const invalidate = useInvalidate(orderId);
  return useMutation({
    mutationFn: (data: CreatePurchaseOrderData) => requests.createPurchaseOrder(orderId, data),
    onSuccess: invalidate,
  });
}

export function useUpdatePurchaseOrder(orderId: string) {
  const invalidate = useInvalidate(orderId);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePurchaseOrderData }) =>
      requests.updatePurchaseOrder(id, data),
    onSuccess: invalidate,
  });
}

export function useAdvancePOStage(orderId: string) {
  const invalidate = useInvalidate(orderId);
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      requests.advancePurchaseOrderStage(id, stageId),
    onSuccess: invalidate,
  });
}

export function useRegeneratePurchaseOrder(orderId: string) {
  const invalidate = useInvalidate(orderId);
  return useMutation({
    mutationFn: ({ id, documentId }: { id: string; documentId: string }) =>
      requests.regeneratePurchaseOrder(id, documentId),
    onSuccess: invalidate,
  });
}

export function useSendPOConfirmation(orderId: string) {
  const invalidate = useInvalidate(orderId);
  return useMutation({
    mutationFn: (id: string) => requests.sendPOConfirmation(id),
    onSuccess: invalidate,
  });
}

export function useDeletePurchaseOrder(orderId: string) {
  const invalidate = useInvalidate(orderId);
  return useMutation({
    mutationFn: requests.deletePurchaseOrder,
    onSuccess: invalidate,
  });
}
