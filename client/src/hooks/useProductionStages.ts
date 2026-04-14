import {
  useProductionStagesQuery,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
  useReorderStages,
  useResetStages,
} from "@/services/production";

/**
 * @deprecated New code should import hooks directly from `@/services/production`.
 * This wrapper is preserved to avoid churning the ~5 existing call sites.
 */
export function useProductionStages() {
  const { data: stages = [], isLoading } = useProductionStagesQuery();
  const create = useCreateStage();
  const update = useUpdateStage();
  const remove = useDeleteStage();
  const reorder = useReorderStages();
  const reset = useResetStages();

  return {
    stages,
    isLoading,
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
