import { apiRequest } from "@/lib/queryClient";

export async function postActivity(orderId: string | number, data: Record<string, any>) {
  const res = await apiRequest("POST", `/api/projects/${orderId}/activities`, data);
  return res.json();
}
