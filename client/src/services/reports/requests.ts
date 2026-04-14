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
