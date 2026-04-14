import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const newsletterKeys = {
  all: ["/api/newsletters"] as const,
  subscribers: ["/api/newsletters/subscribers"] as const,
};

export async function fetchNewsletters(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/newsletters");
  return res.json();
}

export async function createNewsletter(data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/newsletters", data);
  return res.json();
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: newsletterKeys.all });
}

export function useNewsletters() {
  return useQuery<any[]>({ queryKey: newsletterKeys.all, queryFn: fetchNewsletters });
}

export function useCreateNewsletter() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: createNewsletter, onSuccess: invalidate });
}
