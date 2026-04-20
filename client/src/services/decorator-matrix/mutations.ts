import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { matrixKeys } from "./keys";
import * as requests from "./requests";

function useInvalidate(supplierId?: string) {
  const queryClient = useQueryClient();
  return (matrixId?: string) => {
    queryClient.invalidateQueries({ queryKey: matrixKeys.all });
    if (supplierId) {
      queryClient.invalidateQueries({ queryKey: matrixKeys.bySupplier(supplierId) });
    }
    if (matrixId) {
      queryClient.invalidateQueries({ queryKey: matrixKeys.detail(matrixId) });
    }
  };
}

export function useCreateSupplierMatrix(supplierId: string) {
  const invalidate = useInvalidate(supplierId);
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => requests.createSupplierMatrix(supplierId, data),
    onSuccess: () => {
      invalidate();
      toast({ title: "Decoration created" });
    },
  });
}

export function useUpdateMatrix(supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      requests.updateMatrix(id, data),
    onSuccess: (_d, { id }) => invalidate(id),
  });
}

export function useDeleteMatrix(supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: requests.deleteMatrix,
    onSuccess: () => invalidate(),
  });
}

export function useCopyMatrix(supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: requests.copyMatrix,
    onSuccess: () => invalidate(),
  });
}

// ── Breakdowns ──

export function useAddBreakdown(matrixId: string, supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: (data: Record<string, unknown> = {}) => requests.addBreakdown(matrixId, data),
    onSuccess: () => invalidate(matrixId),
  });
}

export function useRemoveBreakdown(matrixId: string, supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: (breakdownId: string) => requests.removeBreakdown(matrixId, breakdownId),
    onSuccess: () => invalidate(matrixId),
  });
}

export function useUpdateBreakdown(matrixId: string, supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: ({ breakdownId, data }: { breakdownId: string; data: Record<string, unknown> }) =>
      requests.updateBreakdown(matrixId, breakdownId, data),
    onSuccess: () => invalidate(matrixId),
  });
}

// ── Rows ──

export function useAddRow(matrixId: string, supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: (data: Record<string, unknown> = {}) => requests.addRow(matrixId, data),
    onSuccess: () => invalidate(matrixId),
  });
}

export function useRemoveRow(matrixId: string, supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: (rowId: string) => requests.removeRow(matrixId, rowId),
    onSuccess: () => invalidate(matrixId),
  });
}

export function useUpdateRow(matrixId: string, supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: ({ rowId, data }: { rowId: string; data: Record<string, unknown> }) =>
      requests.updateRow(matrixId, rowId, data),
    onSuccess: () => invalidate(matrixId),
  });
}

// ── Grid batch save ──

export function useSaveGrid(matrixId: string, supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  const { toast } = useToast();
  return useMutation({
    mutationFn: (cells: Array<{ rowId: string; breakdownId: string; price: string }>) =>
      requests.saveGrid(matrixId, cells),
    onSuccess: () => {
      invalidate(matrixId);
      toast({ title: "Grid saved" });
    },
  });
}
