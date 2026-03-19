import { apiRequest } from "@/lib/queryClient";

// Order items
export async function deleteOrderItem(orderId: string | number, orderItemId: string | number) {
  await apiRequest("DELETE", `/api/orders/${orderId}/items/${orderItemId}`);
}

export async function updateOrderItem(orderId: string | number, itemId: string | number, updates: Record<string, any>) {
  await apiRequest("PATCH", `/api/orders/${orderId}/items/${itemId}`, updates);
}

// Line items
export async function addLine(orderItemId: string | number, line: Record<string, any>) {
  await apiRequest("POST", `/api/order-items/${orderItemId}/lines`, { ...line, orderItemId });
}

export async function updateLine(orderItemId: string | number, lineId: string | number, updates: Record<string, any>) {
  await apiRequest("PATCH", `/api/order-items/${orderItemId}/lines/${lineId}`, updates);
}

export async function deleteLine(orderItemId: string | number, lineId: string | number) {
  await apiRequest("DELETE", `/api/order-items/${orderItemId}/lines/${lineId}`);
}

// Charges
export async function addCharge(orderItemId: string | number, charge: Record<string, any>) {
  await apiRequest("POST", `/api/order-items/${orderItemId}/charges`, { ...charge, orderItemId });
}

export async function updateCharge(orderItemId: string | number, chargeId: string | number, updates: Record<string, any>) {
  await apiRequest("PATCH", `/api/order-items/${orderItemId}/charges/${chargeId}`, updates);
}

export async function deleteCharge(orderItemId: string | number, chargeId: string | number) {
  await apiRequest("DELETE", `/api/order-items/${orderItemId}/charges/${chargeId}`);
}

// Artworks
export async function createArtwork(orderItemId: string | number, data: Record<string, any>) {
  const res = await apiRequest("POST", `/api/order-items/${orderItemId}/artworks`, data);
  return res.json();
}

export async function deleteArtwork(orderItemId: string | number, artworkId: string | number) {
  await apiRequest("DELETE", `/api/order-items/${orderItemId}/artworks/${artworkId}`);
}
