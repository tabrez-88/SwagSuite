import { apiRequest } from "@/lib/queryClient";

export async function updateProject(projectId: string | number, updates: Record<string, any>) {
  await apiRequest("PATCH", `/api/projects/${projectId}`, updates);
}

export async function duplicateProject(projectId: string | number) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/duplicate`);
  return res.json();
}

export async function recalculateTotal(projectId: string | number) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/recalculate-total`);
  return res.json();
}

export async function createShareLink(projectId: string | number) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/presentation/share-link`);
  return res.json();
}

export async function createPortalToken(projectId: string | number) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/portal-tokens`);
  return res.json();
}

export async function createVendorInvoice(projectId: string | number, data: Record<string, any>) {
  return apiRequest("POST", `/api/projects/${projectId}/vendor-invoices`, data);
}

export async function updateVendorInvoice(projectId: string | number, invoiceId: string | number, data: Record<string, any>) {
  const res = await apiRequest("PATCH", `/api/projects/${projectId}/vendor-invoices/${invoiceId}`, data);
  return res.json();
}
