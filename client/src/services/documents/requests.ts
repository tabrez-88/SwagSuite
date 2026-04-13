import { apiRequest } from "@/lib/queryClient";

export async function updateDocumentMeta(documentId: string | number, data: Record<string, any>) {
  const res = await apiRequest("PATCH", `/api/documents/${documentId}`, data);
  return res.json();
}

export async function deleteDocument(documentId: string | number) {
  await apiRequest("DELETE", `/api/documents/${documentId}`);
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
