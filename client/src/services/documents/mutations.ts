import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "@/services/projects/keys";
import { activityKeys } from "@/services/activities/keys";
import { documentKeys } from "./keys";
import * as requests from "./requests";

export function useUpdateDocumentMeta(projectId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string | number; data: Record<string, any> }) =>
      requests.updateDocumentMeta(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.byOrder(projectId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.byOrder(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

export function useUpdatePODocMeta(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ docId, updates, activityContent }: { docId: string; updates: Record<string, any>; activityContent?: string }) =>
      requests.updatePODocMeta(docId, updates, projectId, activityContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.byOrder(projectId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.byOrder(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: ["/api/production/po-report"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/alerts"] });
    },
    onError: () => toast({ title: "Failed to update PO", variant: "destructive" }),
  });
}

export function useDeleteDocument(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (documentId: string | number) => requests.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.byOrder(projectId) });
      toast({ title: "Document deleted" });
    },
    onError: () => toast({ title: "Failed to delete document", variant: "destructive" }),
  });
}
