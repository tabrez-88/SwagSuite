import { useMemo } from "react";
import {
  useProductionStagesQuery,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
  useReorderStages,
  useResetStages,
} from "@/services/production";
import type { ProductionStage } from "@/constants/productionStages";

/**
 * Primary hook for production stages — provides stage data + flag-based helpers.
 * Use this over raw `useProductionStagesQuery()` when you need stage lookups.
 */
export function useProductionStages() {
  const { data: stages = [], isLoading } = useProductionStagesQuery();
  const create = useCreateStage();
  const update = useUpdateStage();
  const remove = useDeleteStage();
  const reorder = useReorderStages();
  const reset = useResetStages();

  // Flag-based helpers
  const stageHelpers = useMemo(() => {
    const sorted = [...stages].sort((a, b) => a.order - b.order);

    const getInitialStage = (): ProductionStage | undefined =>
      sorted.find(s => s.isInitial) || sorted[0];

    const getFinalStageIds = (): string[] =>
      sorted.filter(s => s.isFinal).map(s => s.id);

    const getStageByFlag = (flag: 'onEmailSent' | 'onVendorConfirm' | 'onBilling'): ProductionStage | undefined =>
      sorted.find(s => s[flag]);

    const getNextStage = (currentId: string): ProductionStage | undefined => {
      const idx = sorted.findIndex(s => s.id === currentId);
      return idx !== -1 && idx < sorted.length - 1 ? sorted[idx + 1] : undefined;
    };

    const getStageById = (id: string): ProductionStage | undefined =>
      sorted.find(s => s.id === id);

    const isOpenStage = (stageId: string): boolean => {
      const finalIds = getFinalStageIds();
      return !finalIds.includes(stageId);
    };

    return { getInitialStage, getFinalStageIds, getStageByFlag, getNextStage, getStageById, isOpenStage };
  }, [stages]);

  return {
    stages,
    isLoading,
    ...stageHelpers,
    createStage: create.mutateAsync,
    updateStage: update.mutateAsync,
    deleteStage: remove.mutateAsync,
    reorderStages: reorder.mutateAsync,
    resetStages: reset.mutateAsync,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
    isReordering: reorder.isPending,
    isResetting: reset.isPending,
  };
}
