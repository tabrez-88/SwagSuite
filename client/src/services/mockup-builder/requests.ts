import { apiRequest } from "@/lib/queryClient";

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
