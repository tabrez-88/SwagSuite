import { apiRequest } from "@/lib/queryClient";
import type { ShippingMethod } from "./types";

export async function createShippingMethod(data: Partial<ShippingMethod>): Promise<ShippingMethod> {
  const res = await apiRequest("POST", "/api/shipping-methods", data);
  return res.json();
}

export async function updateShippingMethod(
  id: string,
  data: Partial<ShippingMethod>,
): Promise<ShippingMethod> {
  const res = await apiRequest("PUT", `/api/shipping-methods/${id}`, data);
  return res.json();
}

export async function reorderShippingMethods(orderedIds: string[]): Promise<void> {
  await apiRequest("PUT", "/api/shipping-methods/reorder", { orderedIds });
}

export async function deleteShippingMethod(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/shipping-methods/${id}`);
}
