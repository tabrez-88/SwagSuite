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

/** Create presentation with file uploads (FormData — must use raw fetch) */
export async function createPresentationWithFiles(
  data: { title: string; description: string; dealNotes: string },
  files: File[],
): Promise<any> {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("dealNotes", data.dealNotes);
  files.forEach((f) => formData.append("files", f));

  const res = await fetch("/api/presentations", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create presentation");
  return res.json();
}
