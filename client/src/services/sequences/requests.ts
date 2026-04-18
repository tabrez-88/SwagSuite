import { apiRequest } from "@/lib/queryClient";

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

export async function replaceSequence(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("PUT", `/api/sequences/${id}`, data);
  return res.json();
}

export async function createSequenceStep(sequenceId: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", `/api/sequences/${sequenceId}/steps`, data);
  return res.json();
}
