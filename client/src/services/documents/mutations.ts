import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { orderKeys } from "@/services/orders/keys";
import { activityKeys } from "@/services/activities/keys";
import { documentKeys } from "./keys";
import * as requests from "./requests";

export function useUpdateDocumentMeta(orderId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string | number; data: Record<string, any> }) =>
      requests.updateDocumentMeta(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.byOrder(orderId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.byOrder(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
    },
  });
}

export function useDeleteDocument(orderId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (documentId: string | number) => requests.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.byOrder(orderId) });
      toast({ title: "Document deleted" });
    },
    onError: () => toast({ title: "Failed to delete document", variant: "destructive" }),
  });
}
