import { apiRequest } from "@/lib/queryClient";
import type { Presentation } from "./types";

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
