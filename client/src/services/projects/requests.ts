import { apiRequest } from "@/lib/queryClient";

export async function updateProject(projectId: string | number, updates: Record<string, any>) {
  await apiRequest("PATCH", `/api/projects/${projectId}`, updates);
}

export async function duplicateProject(projectId: string | number) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/duplicate`);
  return res.json();
}

export async function recalculateTotal(projectId: string | number) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/recalculate-total`);
  return res.json();
}
