import { apiRequest } from "@/lib/queryClient";

export async function updateOrder(orderId: string | number, updates: Record<string, any>) {
  await apiRequest("PATCH", `/api/orders/${orderId}`, updates);
}

export async function duplicateOrder(orderId: string | number) {
  const res = await apiRequest("POST", `/api/orders/${orderId}/duplicate`);
  return res.json();
}

export async function recalculateTotal(orderId: string | number) {
  const res = await apiRequest("POST", `/api/orders/${orderId}/recalculate-total`);
  return res.json();
}
