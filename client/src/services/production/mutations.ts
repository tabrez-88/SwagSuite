import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productionKeys } from "./keys";
import * as requests from "./requests";

function useInvalidateStages() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: productionKeys.stages });
}

function useInvalidateActionTypes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: productionKeys.nextActionTypes });
}

// ---- Production stages ----
export function useCreateStage() {
  const invalidate = useInvalidateStages();
  return useMutation({ mutationFn: requests.createStage, onSuccess: invalidate });
}

export function useUpdateStage() {
  const invalidate = useInvalidateStages();
  return useMutation({ mutationFn: requests.updateStage, onSuccess: invalidate });
}

export function useDeleteStage() {
  const invalidate = useInvalidateStages();
  return useMutation({ mutationFn: requests.deleteStage, onSuccess: invalidate });
}

export function useReorderStages() {
  const invalidate = useInvalidateStages();
  return useMutation({ mutationFn: requests.reorderStages, onSuccess: invalidate });
}

export function useResetStages() {
  const invalidate = useInvalidateStages();
  return useMutation({ mutationFn: requests.resetStages, onSuccess: invalidate });
}

// ---- Next action types ----
export function useCreateActionType() {
  const invalidate = useInvalidateActionTypes();
  return useMutation({ mutationFn: requests.createActionType, onSuccess: invalidate });
}

export function useUpdateActionType() {
  const invalidate = useInvalidateActionTypes();
  return useMutation({ mutationFn: requests.updateActionType, onSuccess: invalidate });
}

export function useDeleteActionType() {
  const invalidate = useInvalidateActionTypes();
  return useMutation({ mutationFn: requests.deleteActionType, onSuccess: invalidate });
}

export function useReorderActionTypes() {
  const invalidate = useInvalidateActionTypes();
  return useMutation({ mutationFn: requests.reorderActionTypes, onSuccess: invalidate });
}

export function useResetActionTypes() {
  const invalidate = useInvalidateActionTypes();
  return useMutation({ mutationFn: requests.resetActionTypes, onSuccess: invalidate });
}
