import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const sequenceKeys = {
  all: ["/api/sequences"] as const,
  detail: (id: string) => [`/api/sequences/${id}`] as const,
  enrollments: ["/api/sequence-enrollments"] as const,
};

export async function fetchSequences(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/sequences");
  return res.json();
}

export async function fetchEnrollments(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/sequence-enrollments");
  return res.json();
}

export async function createSequence(data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/sequences", data);
  return res.json();
}

export async function updateSequence(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("PATCH", `/api/sequences/${id}`, data);
  return res.json();
}

export async function deleteSequence(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/sequences/${id}`);
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: sequenceKeys.all });
    queryClient.invalidateQueries({ queryKey: sequenceKeys.enrollments });
  };
}

export function useSequences() {
  return useQuery<any[]>({ queryKey: sequenceKeys.all, queryFn: fetchSequences });
}

export function useSequenceEnrollments() {
  return useQuery<any[]>({ queryKey: sequenceKeys.enrollments, queryFn: fetchEnrollments });
}

export function useCreateSequence() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: createSequence, onSuccess: invalidate });
}

export function useUpdateSequence() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateSequence(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteSequence() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deleteSequence, onSuccess: invalidate });
}
