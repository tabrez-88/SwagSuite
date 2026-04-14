import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@/lib/wouter-compat";
import { useToast } from "@/hooks/use-toast";
import { useProductionStages } from "@/hooks/useProductionStages";
import { useNextActionTypes } from "@/hooks/useNextActionTypes";
import { usePoReportDetail, productionKeys } from "@/services/production";
import { updateDocumentMeta } from "@/services/documents/requests";
import { updateProjectProduction } from "@/services/projects/requests";
import { projectKeys } from "@/services/projects";
import type { PreviewFile } from "./types";

export function usePODetailPanel(documentId: string | null, open: boolean) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const { stages: productionStages } = useProductionStages();
  const { actionTypes } = useNextActionTypes();

  const { data: po, isLoading } = usePoReportDetail<any>(documentId, open);

  const updateStageMutation = useMutation({
    mutationFn: async ({ stage, status }: { stage?: string; status?: string }) => {
      const currentMeta = po?.metadata || {};
      const newMeta = {
        ...currentMeta,
        ...(stage && { poStage: stage }),
        ...(status && { poStatus: status }),
      };
      return updateDocumentMeta(documentId!, { metadata: newMeta });
    },
    onMutate: async ({ stage, status }) => {
      if (!documentId) return;
      const key = productionKeys.poReportDetail(documentId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<any>(key);
      if (previous) {
        const newMeta = {
          ...(previous.metadata || {}),
          ...(stage && { poStage: stage }),
          ...(status && { poStatus: status }),
        };
        queryClient.setQueryData(key, {
          ...previous,
          metadata: newMeta,
          ...(stage && { poStage: stage }),
          ...(status && { poStatus: status }),
        });
      }
      return { previous };
    },
    onSuccess: () => {
      toast({ title: "PO Updated", description: "Purchase order has been updated." });
      queryClient.invalidateQueries({ queryKey: productionKeys.poReportDetail(documentId ?? "") });
      queryClient.invalidateQueries({ queryKey: ["/api/production/po-report"] });
      queryClient.invalidateQueries({ queryKey: productionKeys.alerts });
      if (po?.order_id) {
        queryClient.invalidateQueries({ queryKey: projectKeys.documents(po.order_id) });
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(po.order_id) });
      }
    },
    onError: (_err, _vars, context) => {
      if (documentId && context?.previous) {
        queryClient.setQueryData(productionKeys.poReportDetail(documentId), context.previous);
      }
      toast({ title: "Error", description: "Failed to update PO.", variant: "destructive" });
    },
  });

  const updateNextActionMutation = useMutation({
    mutationFn: (data: {
      nextActionType?: string;
      nextActionDate?: string | null;
      nextActionNotes?: string;
    }) => updateProjectProduction(po?.order_id, data),
    onSuccess: () => {
      toast({ title: "Next Action Updated" });
      queryClient.invalidateQueries({ queryKey: productionKeys.poReportDetail(documentId ?? "") });
      queryClient.invalidateQueries({ queryKey: ["/api/production/po-report"] });
      queryClient.invalidateQueries({ queryKey: productionKeys.alerts });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to update next action.",
        variant: "destructive",
      }),
  });

  const poStage = po?.poStage || "created";
  const poStatus = po?.poStatus || "ok";

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
