import { apiRequest } from "@/lib/queryClient";

export async function createShipment(orderId: string | number, data: Record<string, any>) {
  const res = await apiRequest("POST", `/api/orders/${orderId}/shipments`, data);
  return res.json();
}

export async function updateShipment(orderId: string | number, shipmentId: string | number, data: Record<string, any>) {
  const res = await apiRequest("PATCH", `/api/orders/${orderId}/shipments/${shipmentId}`, data);
  return res.json();
}

export async function deleteShipment(orderId: string | number, shipmentId: string | number) {
  await apiRequest("DELETE", `/api/orders/${orderId}/shipments/${shipmentId}`);
}
