import { apiRequest } from "@/lib/queryClient";
import type { GeneratedReport } from "./types";

export async function generateReport(query: string): Promise<GeneratedReport> {
  const res = await apiRequest("POST", "/api/reports/generate", { query });
  return res.json();
}

export async function fetchCommissionReport(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await apiRequest("GET", `/api/reports/commissions?${params.toString()}`);
  return res.json();
}

export async function fetchShippingMargins(period: string) {
  const res = await apiRequest("GET", `/api/dashboard/shipping-margins?period=${period}`);
  return res.json();
}

export async function createReportTemplate(data: {
  name: string;
  query: string;
  description?: string;
  schedule?: string;
}) {
  const res = await apiRequest("POST", "/api/reports/templates", data);
  return res.json();
}

export async function updateReportTemplate(id: string, data: Record<string, unknown>) {
  const res = await apiRequest("PUT", `/api/reports/templates/${id}`, data);
  return res.json();
}

export async function deleteReportTemplate(id: string) {
  const res = await apiRequest("DELETE", `/api/reports/templates/${id}`);
  return res.json();
}
