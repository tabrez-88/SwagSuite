import { apiRequest } from "@/lib/queryClient";
import type { PaymentTerm } from "./types";

export async function createPaymentTerm(data: Partial<PaymentTerm>): Promise<PaymentTerm> {
  const res = await apiRequest("POST", "/api/payment-terms", data);
  return res.json();
}

export async function updatePaymentTerm(
  id: string,
  data: Partial<PaymentTerm>,
): Promise<PaymentTerm> {
  const res = await apiRequest("PATCH", `/api/payment-terms/${id}`, data);
  return res.json();
}

export async function deletePaymentTerm(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/payment-terms/${id}`);
}

export async function setDefaultPaymentTerm(id: string): Promise<PaymentTerm> {
  const res = await apiRequest("POST", `/api/payment-terms/${id}/set-default`);
  return res.json();
}
