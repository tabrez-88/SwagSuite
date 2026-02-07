import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DEFAULT_STAGES, type ProductionStage } from "@/lib/productionStages";

const STAGES_QUERY_KEY = ["/api/production/stages"];

export function useProductionStages() {
  const queryClient = useQueryClient();

  const { data: stages = DEFAULT_STAGES, isLoading } = useQuery<ProductionStage[]>({
    queryKey: STAGES_QUERY_KEY,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createStageMutation = useMutation({
    mutationFn: async (stage: { name: string; description?: string; color: string; icon: string }) => {
      const res = await apiRequest("POST", "/api/production/stages", stage);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAGES_QUERY_KEY });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; color?: string; icon?: string }) => {
      const res = await apiRequest("PUT", `/api/production/stages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAGES_QUERY_KEY });
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/production/stages/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAGES_QUERY_KEY });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (stageIds: string[]) => {
      const res = await apiRequest("POST", "/api/production/stages/reorder", { stageIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAGES_QUERY_KEY });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/production/stages/reset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAGES_QUERY_KEY });
    },
  });

  return {
    stages,
    isLoading,
    createStage: createStageMutation.mutateAsync,
    updateStage: updateStageMutation.mutateAsync,
    deleteStage: deleteStageMutation.mutateAsync,
    reorderStages: reorderMutation.mutateAsync,
    resetStages: resetMutation.mutateAsync,
    isCreating: createStageMutation.isPending,
    isUpdating: updateStageMutation.isPending,
    isDeleting: deleteStageMutation.isPending,
    isReordering: reorderMutation.isPending,
    isResetting: resetMutation.isPending,
  };
}
