import { apiRequest } from "@/lib/queryClient";

export async function createInvoice(orderId: string | number) {
  const res = await apiRequest("POST", `/api/orders/${orderId}/invoice`);
  return res.json();
}

export async function updateInvoice(orderId: string | number, data: Record<string, any>) {
  const res = await apiRequest("PATCH", `/api/orders/${orderId}/invoice`, data);
  return res.json();
}

export async function recordManualPayment(invoiceId: string | number, data: Record<string, any>) {
  const res = await apiRequest("POST", `/api/invoices/${invoiceId}/manual-payment`, data);
  return res.json();
}

export async function createStripePayment(invoiceId: string | number) {
  const res = await apiRequest("POST", `/api/invoices/${invoiceId}/payment-link`);
  return res.json();
}
