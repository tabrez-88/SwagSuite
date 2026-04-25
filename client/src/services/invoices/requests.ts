import { apiRequest } from "@/lib/queryClient";

export async function createInvoice(projectId: string | number) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/invoice`);
  return res.json();
}

export async function updateInvoice(projectId: string | number, data: Record<string, any>) {
  const res = await apiRequest("PATCH", `/api/projects/${projectId}/invoice`, data);
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

export async function createDepositInvoice(projectId: string | number) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/deposit-invoice`);
  return res.json();
}

export async function createFinalInvoice(projectId: string | number) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/final-invoice`);
  return res.json();
}

export async function getInvoices(projectId: string | number) {
  const res = await apiRequest("GET", `/api/projects/${projectId}/invoices`);
  return res.json();
}
