import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useProductionStages } from "@/hooks/useProductionStages";
import { useNextActionTypes } from "@/hooks/useNextActionTypes";
import type { PreviewFile } from "./types";

export function usePODetailPanel(documentId: string | null, open: boolean) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const { stages: productionStages } = useProductionStages();
  const { actionTypes } = useNextActionTypes();

  const { data: po, isLoading } = useQuery<any>({
    queryKey: [`/api/production/po-report/${documentId}`],
    enabled: !!documentId && open,
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ stage, status }: { stage?: string; status?: string }) => {
      const currentMeta = po?.metadata || {};
      const newMeta = {
        ...currentMeta,
        ...(stage && { poStage: stage }),
        ...(status && { poStatus: status }),
      };
      const response = await apiRequest("PATCH", `/api/documents/${documentId}`, {
        metadata: newMeta,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "PO Updated", description: "Purchase order has been updated." });
      queryClient.invalidateQueries({ queryKey: [`/api/production/po-report/${documentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/po-report"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/alerts"] });
      // Also invalidate project-level queries so PO section in project detail reflects changes
      if (po?.order_id) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${po.order_id}/documents`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${po.order_id}`] });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update PO.", variant: "destructive" });
    },
  });

  const updateNextActionMutation = useMutation({
    mutationFn: async (data: { nextActionType?: string; nextActionDate?: string | null; nextActionNotes?: string }) => {
      const response = await apiRequest("PATCH", `/api/projects/${po?.order_id}/production`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Next Action Updated" });
      queryClient.invalidateQueries({ queryKey: [`/api/production/po-report/${documentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/po-report"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/alerts"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update next action.", variant: "destructive" });
    },
  });

  const poStage = po?.poStage || "created";
  const poStatus = po?.poStatus || "ok";

  // Calculate stage progress from dynamic stages
  const currentStageIdx = productionStages.findIndex((s: any) => s.id === poStage);
  const currentStageOrder = currentStageIdx >= 0 ? currentStageIdx + 1 : 1;
  const totalStages = productionStages.length;

  return {
    po,
    isLoading,
    activeTab,
    setActiveTab,
    previewFile,
    setPreviewFile,
    productionStages,
    actionTypes,
    poStage,
    poStatus,
    currentStageOrder,
    totalStages,
    updateStageMutation,
    updateNextActionMutation,
    setLocation,
  };
}
