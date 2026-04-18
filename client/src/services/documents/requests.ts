import { apiRequest } from "@/lib/queryClient";

export async function updateDocumentMeta(documentId: string | number, data: Record<string, any>) {
  const res = await apiRequest("PATCH", `/api/documents/${documentId}`, data);
  return res.json();
}

export async function deleteDocument(documentId: string | number) {
  await apiRequest("DELETE", `/api/documents/${documentId}`);
}

/** Upload generated document PDF (FormData — must use raw fetch) */
export async function uploadDocument(projectId: string | number, formData: FormData) {
  const response = await fetch(`/api/projects/${projectId}/documents`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to save document");
  return response.json();
}

export async function createQuoteApproval(
  projectId: string | number,
  data: { clientEmail: string; clientName: string; documentId?: string; pdfPath?: string; quoteTotal?: string },
) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/quote-approvals`, data);
  return res.json();
}

export async function fetchNextPoSequence(): Promise<any> {
  const res = await apiRequest("GET", "/api/documents/next-po-sequence");
  return res.json();
}

export async function updatePODocMeta(
  documentId: string | number,
  data: Record<string, any>,
  projectId: string | number,
  activityContent?: string,
) {
  const res = await apiRequest("PATCH", `/api/documents/${documentId}`, data);
  const result = await res.json();
  if (activityContent) {
    try {
      await apiRequest("POST", `/api/projects/${projectId}/activities`, {
        activityType: "system_action",
        content: activityContent,
      });
    } catch { /* best-effort */ }
  }
  return result;
}
