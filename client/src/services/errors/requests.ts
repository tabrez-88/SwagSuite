import { apiRequest } from "@/lib/queryClient";

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
