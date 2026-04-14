/**
 * Decorator matrix service — centralized endpoints for `/api/matrices/*` and
 * `/api/suppliers/:id/matrices`, used by DecoratorMatrixTab.
 *
 * NOTE: `pages/Settings/DecoratorMatrixTab.tsx` still contains inline
 * `useMutation` calls because each of its nested editors (groups / rows /
 * charges) has bespoke optimistic-update logic. Migrate those gradually to
 * consume these request functions; keep the tab's react-query code-path
 * unchanged until each surface is converted.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const matrixKeys = {
  all: ["/api/matrices"] as const,
  detail: (id: string) => [`/api/matrices/${id}`] as const,
  bySupplier: (supplierId: string) => [`/api/suppliers/${supplierId}/matrices`] as const,
};

export async function fetchMatrix(id: string): Promise<any> {
  const res = await apiRequest("GET", `/api/matrices/${id}`);
  return res.json();
}

export async function fetchMatricesBySupplier(supplierId: string): Promise<any[]> {
  const res = await apiRequest("GET", `/api/suppliers/${supplierId}/matrices`);
  return res.json();
}

export async function createMatrix(data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/matrices", data);
  return res.json();
}

export async function updateMatrix(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("PATCH", `/api/matrices/${id}`, data);
  return res.json();
}

export async function deleteMatrix(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/matrices/${id}`);
}

export async function copyMatrix(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", `/api/matrices/${id}/copy`, data);
  return res.json();
}

export function useMatrix(id: string | undefined) {
  return useQuery<any>({
    queryKey: matrixKeys.detail(id ?? ""),
    queryFn: () => fetchMatrix(id!),
    enabled: !!id,
  });
}

export function useMatricesBySupplier(supplierId: string | undefined) {
  return useQuery<any[]>({
    queryKey: matrixKeys.bySupplier(supplierId ?? ""),
    queryFn: () => fetchMatricesBySupplier(supplierId!),
    enabled: !!supplierId,
  });
}

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
  return useMutation({ mutationFn: createMatrix, onSuccess: invalidate });
}

export function useUpdateMatrix(supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateMatrix(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteMatrix(supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({ mutationFn: deleteMatrix, onSuccess: invalidate });
}

export function useCopyMatrix(supplierId?: string) {
  const invalidate = useInvalidate(supplierId);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => copyMatrix(id, data),
    onSuccess: invalidate,
  });
}
