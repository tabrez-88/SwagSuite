import { apiRequest } from "@/lib/queryClient";

export async function sendCommunication(projectId: string | number, data: Record<string, any>) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/communications`, data);
  return res.json();
}

export async function sendGenericEmail(data: Record<string, any>) {
  const res = await apiRequest("POST", "/api/send-email", data);
  return res.json();
}
