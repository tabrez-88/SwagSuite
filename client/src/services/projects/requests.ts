import { apiRequest } from "@/lib/queryClient";
import type { Invoice } from "@shared/schema";

export async function updateProject(projectId: string | number, updates: Record<string, any>) {
  await apiRequest("PATCH", `/api/projects/${projectId}`, updates);
}

export async function updateProjectProduction(
  projectId: string | number,
  data: Record<string, unknown>,
) {
  const res = await apiRequest("PATCH", `/api/projects/${projectId}/production`, data);
  return res.json();
}

export async function postProductComment(
  projectId: string | number,
  payload: { orderItemId: string; content: string },
): Promise<any> {
  const res = await apiRequest("POST", `/api/projects/${projectId}/product-comments`, payload);
  return res.json();
}

export interface CalculateTaxResponse {
  taxAmount?: string | number;
  taxRate?: string | number;
  taxDetails?: Record<string, unknown>;
}

export async function calculateTax(projectId: string | number): Promise<CalculateTaxResponse> {
  const res = await apiRequest("POST", `/api/projects/${projectId}/calculate-tax`);
  return res.json();
}

export async function generateApproval(
  projectId: string | number,
  payload: {
    orderItemId: string | number;
    artworkItemId: string | number;
    clientEmail: string;
    clientName?: string;
  },
): Promise<{ approvalToken: string; [key: string]: any }> {
  const res = await apiRequest("POST", `/api/projects/${projectId}/generate-approval`, payload);
  return res.json();
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

/** Upload files to a project (FormData — must use raw fetch) */
export async function uploadProjectFiles(projectId: string | number, formData: FormData) {
  const res = await fetch(`/api/projects/${projectId}/files`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || JSON.parse(text).message || text; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchProject(projectId: string | number) {
  const res = await apiRequest("GET", `/api/projects/${projectId}`);
  return res.json();
}

export async function createProject(data: Record<string, any>) {
  const res = await apiRequest("POST", "/api/projects", data);
  return res.json();
}

export async function fetchProjectFiles(projectId: string | number) {
  const res = await apiRequest("GET", `/api/projects/${projectId}/files`);
  return res.json();
}

export async function linkLibraryFiles(projectId: string | number, data: { mediaLibraryIds: string[]; fileType: string }) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/files/from-library`, data);
  return res.json();
}

export async function deleteProjectFile(projectId: string | number, fileId: string | number) {
  await apiRequest("DELETE", `/api/projects/${projectId}/files/${fileId}`);
}

export async function updateQuoteApproval(
  projectId: string | number,
  approvalId: string | number,
  data: Record<string, any>,
) {
  const res = await apiRequest("PATCH", `/api/projects/${projectId}/quote-approvals/${approvalId}`, data);
  return res.json();
}

/** Generic DELETE by full URL path (used by useSectionItemDelete) */
export async function deleteByEndpoint(url: string) {
  await apiRequest("DELETE", url);
}

export async function fetchProjectInvoice(projectId: string | number): Promise<Invoice | null> {
  const res = await apiRequest("GET", `/api/projects/${projectId}/invoice`);
  return res.json();
}

export async function fetchProjectCommunications(
  projectId: string | number,
  type: "client_email" | "vendor_email",
) {
  const res = await apiRequest("GET", `/api/projects/${projectId}/communications?type=${type}`);
  return res.json();
}
