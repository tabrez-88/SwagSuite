import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const mockupBuilderKeys = {
  all: ["mockup-builder"] as const,
  search: (q: string) => ["/api/mockup-builder/products/search", { q }] as const,
  templates: ["/api/mockup-builder/templates"] as const,
};

export async function searchMockupProducts(q: string): Promise<any[]> {
  const res = await apiRequest("GET", `/api/mockup-builder/products/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

export async function downloadMockups(payload: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/mockup-builder/mockups/download", payload);
  return res.json();
}

export async function emailMockups(payload: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/mockup-builder/mockups/email", payload);
  return res.json();
}

export async function generateAiTemplates(payload: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/mockup-builder/generate-ai-templates", payload);
  return res.json();
}

export function useMockupTemplates<T = any>() {
  return useQuery<T>({ queryKey: mockupBuilderKeys.templates });
}

export function useSearchMockupProducts() {
  return useMutation({ mutationFn: searchMockupProducts });
}

export function useDownloadMockups() {
  return useMutation({ mutationFn: downloadMockups });
}

export function useEmailMockups() {
  return useMutation({ mutationFn: emailMockups });
}

export function useGenerateAiTemplates() {
  return useMutation({ mutationFn: generateAiTemplates });
}
