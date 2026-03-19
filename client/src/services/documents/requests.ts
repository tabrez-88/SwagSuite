import { apiRequest } from "@/lib/queryClient";

export async function updateDocumentMeta(documentId: string | number, data: Record<string, any>) {
  const res = await apiRequest("PATCH", `/api/documents/${documentId}`, data);
  return res.json();
}

export async function deleteDocument(documentId: string | number) {
  await apiRequest("DELETE", `/api/documents/${documentId}`);
}
