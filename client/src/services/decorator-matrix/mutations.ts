import { useMutation, useQueryClient } from "@tanstack/react-query";
import { matrixKeys } from "./keys";
import * as requests from "./requests";

function useInvalidate(supplierId?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: matrixKeys.all });
    if (supplierId) {
      queryClient.invalidateQueries({ queryKey: matrixKeys.bySupplier(supplierId) });
    }
  };
}

export function useCreateMatrix(supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({ mutationFn: requests.createMatrix, onSuccess: invalidate });
}

export function useUpdateMatrix(supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      requests.updateMatrix(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteMatrix(supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({ mutationFn: requests.deleteMatrix, onSuccess: invalidate });
}

export function useCopyMatrix(supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      requests.copyMatrix(id, data),
    onSuccess: invalidate,
  });
}
