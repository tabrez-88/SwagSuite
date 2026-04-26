import { apiRequest } from "@/lib/queryClient";
import type { GeneratedReport, ReportTemplate } from "./types";

export async function generateReport(query: string): Promise<GeneratedReport> {
  const res = await apiRequest("POST", "/api/reports/generate", { query });
  return res.json();
}

export async function saveReportTemplate(template: Partial<ReportTemplate>): Promise<ReportTemplate> {
  const res = await apiRequest("POST", "/api/reports/templates", template);
  return res.json();
}

export async function runReportTemplate(templateId: string): Promise<GeneratedReport> {
  const res = await apiRequest("POST", `/api/reports/templates/${templateId}/run`);
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
