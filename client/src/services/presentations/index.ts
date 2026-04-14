import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const presentationKeys = {
  all: ["/api/presentations"] as const,
  detail: (id: string) => [`/api/presentations/${id}`] as const,
};

export interface Presentation {
  id: string;
  title: string;
  [key: string]: unknown;
}

export async function fetchPresentations(): Promise<Presentation[]> {
  const res = await apiRequest("GET", "/api/presentations");
  return res.json();
}

export async function createPresentation(data: Partial<Presentation>): Promise<Presentation> {
  const res = await apiRequest("POST", "/api/presentations", data);
  return res.json();
}

export async function importFromHubspot(payload: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/presentations/import-hubspot", payload);
  return res.json();
}

export async function generatePresentationContent(id: string): Promise<any> {
  const res = await apiRequest("POST", `/api/presentations/${id}/generate`);
  return res.json();
}

export async function deletePresentation(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/presentations/${id}`);
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: presentationKeys.all });
}

export function usePresentations() {
  return useQuery<Presentation[]>({
    queryKey: presentationKeys.all,
    queryFn: fetchPresentations,
  });
}

export function useCreatePresentation() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: createPresentation, onSuccess: invalidate });
}

export function useImportPresentationFromHubspot() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: importFromHubspot, onSuccess: invalidate });
}

export function useGeneratePresentationContent() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: generatePresentationContent, onSuccess: invalidate });
}

export function useDeletePresentation() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deletePresentation, onSuccess: invalidate });
}
