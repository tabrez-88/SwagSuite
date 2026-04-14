import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const errorTrackingKeys = {
  all: ["/api/errors"] as const,
};

export async function fetchErrors(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/errors");
  return res.json();
}

export async function createError(data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/errors", data);
  return res.json();
}

export async function updateError(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("PUT", `/api/errors/${id}`, data);
  return res.json();
}

export async function resolveError(id: string): Promise<any> {
  const res = await apiRequest("POST", `/api/errors/${id}/resolve`);
  return res.json();
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: errorTrackingKeys.all });
}

export function useErrors() {
  return useQuery<any[]>({ queryKey: errorTrackingKeys.all, queryFn: fetchErrors });
}

export function useCreateError() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: createError, onSuccess: invalidate });
}

export function useUpdateError() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateError(id, data),
    onSuccess: invalidate,
  });
}

export function useResolveError() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: resolveError, onSuccess: invalidate });
}
