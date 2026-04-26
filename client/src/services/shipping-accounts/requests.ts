import { apiRequest } from "@/lib/queryClient";
import type { ShippingAccount } from "./types";

export async function createShippingAccount(data: Partial<ShippingAccount>): Promise<ShippingAccount> {
  const res = await apiRequest("POST", "/api/shipping-accounts", data);
  return res.json();
}

export async function updateShippingAccount(
  id: string,
  data: Partial<ShippingAccount>,
): Promise<ShippingAccount> {
  const res = await apiRequest("PUT", `/api/shipping-accounts/${id}`, data);
  return res.json();
}

export async function deleteShippingAccount(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/shipping-accounts/${id}`);
}
