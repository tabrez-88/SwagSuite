import { apiRequest } from "@/lib/queryClient";

export async function sendCommunication(orderId: string | number, data: Record<string, any>) {
  const res = await apiRequest("POST", `/api/orders/${orderId}/communications`, data);
  return res.json();
}

export async function sendGenericEmail(data: Record<string, any>) {
  const res = await apiRequest("POST", "/api/send-email", data);
  return res.json();
}
