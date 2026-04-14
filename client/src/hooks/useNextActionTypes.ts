import {
  useNextActionTypesQuery,
  useCreateActionType,
  useUpdateActionType,
  useDeleteActionType,
  useReorderActionTypes,
  useResetActionTypes,
} from "@/services/production";

export {
  DEFAULT_ACTION_TYPES,
  getActionTypeBadgeClass,
} from "@/services/production";
export type { NextActionType } from "@/services/production";

/**
 * @deprecated Import hooks directly from `@/services/production`.
 */
export function useNextActionTypes() {
  const { data: actionTypes = [], isLoading } = useNextActionTypesQuery();
  const create = useCreateActionType();
  const update = useUpdateActionType();
  const remove = useDeleteActionType();
  const reorder = useReorderActionTypes();
  const reset = useResetActionTypes();

  return {
    actionTypes,
    isLoading,
    createType: create.mutateAsync,
    updateType: update.mutateAsync,
    deleteType: remove.mutateAsync,
    reorderTypes: reorder.mutateAsync,
    resetTypes: reset.mutateAsync,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
    isResetting: reset.isPending,
  };
}
