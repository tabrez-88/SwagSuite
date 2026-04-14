import { useQuery } from "@tanstack/react-query";
import { reportKeys } from "./keys";
import type { LeadSourceReport, ReportTemplate, ReportSuggestion, GeneratedReport } from "./types";

export function useLeadSourceReport() {
  return useQuery<LeadSourceReport[]>({ queryKey: reportKeys.leadSources });
}

export function useReportTemplates() {
  return useQuery<ReportTemplate[]>({ queryKey: reportKeys.templates });
}

export function useReportSuggestions() {
  return useQuery<ReportSuggestion[]>({ queryKey: reportKeys.suggestions });
}

export function useRecentReports() {
  return useQuery<GeneratedReport[]>({ queryKey: reportKeys.recent });
}

export function useProjectReport<T = any>(filters?: unknown, enabled = true) {
  return useQuery<T>({
    queryKey: reportKeys.projectReport(filters),
    enabled,
  });
}

export function useDashboardStats<T = any>() {
  return useQuery<T>({ queryKey: reportKeys.dashboardStats });
}

export function useTeamPerformance<T = any>() {
  return useQuery<T>({ queryKey: reportKeys.teamPerformance });
}

export function useArAging<T = any>() {
  return useQuery<T>({ queryKey: reportKeys.arAging });
}

export function useCommissionReport<T = any>(from?: string, to?: string) {
  return useQuery<T>({
    queryKey: reportKeys.commissions(from, to),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/reports/commissions?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
  });
}
