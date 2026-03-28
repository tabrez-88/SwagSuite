import { apiRequest } from "@/lib/queryClient";

export async function postActivity(projectId: string | number, data: Record<string, any>) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/activities`, data);
  return res.json();
}
