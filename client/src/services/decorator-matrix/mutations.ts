import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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

export function useCreateSupplierMatrix(supplierId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => requests.createSupplierMatrix(supplierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matrixKeys.bySupplier(supplierId) });
      toast({ title: "Matrix created" });
    },
  });
}

export function useCreateMatrixEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ matrixId, entry }: { matrixId: string; entry: Record<string, unknown> }) =>
      requests.createMatrixEntry(matrixId, entry),
    onSuccess: (_data, { matrixId }) => {
      queryClient.invalidateQueries({ queryKey: matrixKeys.detail(matrixId) });
      toast({ title: "Entry added" });
    },
  });
}

export function useDeleteMatrixEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matrixId, entryId }: { matrixId: string; entryId: string }) =>
      requests.deleteMatrixEntry(matrixId, entryId),
    onSuccess: (_data, { matrixId }) =>
      queryClient.invalidateQueries({ queryKey: matrixKeys.detail(matrixId) }),
  });
}

export function useUpdateMatrixEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matrixId, entryId, updates }: { matrixId: string; entryId: string; updates: Record<string, unknown> }) =>
      requests.updateMatrixEntry(matrixId, entryId, updates),
    onSuccess: (_data, { matrixId }) =>
      queryClient.invalidateQueries({ queryKey: matrixKeys.detail(matrixId) }),
  });
}

export function useApplyMatrix() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: requests.applyMatrix,
    onError: () => toast({ title: "Failed to apply matrix", variant: "destructive" }),
  });
}
