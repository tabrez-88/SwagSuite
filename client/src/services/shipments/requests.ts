import { apiRequest } from "@/lib/queryClient";

export async function createShipment(projectId: string | number, data: Record<string, any>) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/shipments`, data);
  return res.json();
}

export async function updateShipment(projectId: string | number, shipmentId: string | number, data: Record<string, any>) {
  const res = await apiRequest("PATCH", `/api/projects/${projectId}/shipments/${shipmentId}`, data);
  return res.json();
}

export async function deleteShipment(projectId: string | number, shipmentId: string | number) {
  await apiRequest("DELETE", `/api/projects/${projectId}/shipments/${shipmentId}`);
}
