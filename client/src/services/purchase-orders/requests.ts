import { apiRequest } from "@/lib/queryClient";
import type {
  PurchaseOrderEntity,
  CreatePurchaseOrderData,
  UpdatePurchaseOrderData,
  ConfirmationResult,
} from "./types";

export async function fetchPurchaseOrders(orderId: string): Promise<PurchaseOrderEntity[]> {
  const res = await apiRequest("GET", `/api/orders/${orderId}/purchase-orders`);
  return res.json();
}

export async function createPurchaseOrder(
  orderId: string,
  data: CreatePurchaseOrderData,
): Promise<PurchaseOrderEntity> {
  const res = await apiRequest("POST", `/api/orders/${orderId}/purchase-orders`, data);
  return res.json();
}

export async function updatePurchaseOrder(
  id: string,
  data: UpdatePurchaseOrderData,
): Promise<PurchaseOrderEntity> {
  const res = await apiRequest("PUT", `/api/purchase-orders/${id}`, data);
  return res.json();
}

export async function advancePurchaseOrderStage(
  id: string,
  stageId: string,
): Promise<PurchaseOrderEntity> {
  const res = await apiRequest("PUT", `/api/purchase-orders/${id}/advance-stage`, { stageId });
  return res.json();
}

export async function regeneratePurchaseOrder(
  id: string,
  documentId: string,
): Promise<PurchaseOrderEntity> {
  const res = await apiRequest("POST", `/api/purchase-orders/${id}/regenerate`, { documentId });
  return res.json();
}

export async function sendPOConfirmation(id: string): Promise<ConfirmationResult> {
  const res = await apiRequest("POST", `/api/purchase-orders/${id}/send-confirmation`);
  return res.json();
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/purchase-orders/${id}`);
}
