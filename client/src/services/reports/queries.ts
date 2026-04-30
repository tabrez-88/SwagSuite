import { useQuery } from "@tanstack/react-query";
import { reportKeys } from "./keys";
import type { LeadSourceReport, ReportSuggestion } from "./types";
import * as requests from "./requests";

export function useLeadSourceReport() {
  return useQuery<LeadSourceReport[]>({ queryKey: reportKeys.leadSources });
}

export function useReportSuggestions() {
  return useQuery<ReportSuggestion[]>({ queryKey: reportKeys.suggestions });
}

export function useProjectReport<T = unknown>(filters?: unknown, enabled = true) {
  return useQuery<T>({
    queryKey: reportKeys.projectReport(filters),
    enabled,
  });
}

export function useDashboardStats<T = unknown>() {
  return useQuery<T>({ queryKey: reportKeys.dashboardStats });
}

export function useTeamPerformance<T = unknown>() {
  return useQuery<T>({ queryKey: reportKeys.teamPerformance });
}

export function useArAging<T = unknown>() {
  return useQuery<T>({ queryKey: reportKeys.arAging });
}

export function useCommissionReport<T = unknown>(from?: string, to?: string) {
  return useQuery<T>({
    queryKey: reportKeys.commissions(from, to),
    queryFn: () => requests.fetchCommissionReport(from, to),
  });
}

export function useShippingMargins<T = unknown>(period: string) {
  return useQuery<T>({
    queryKey: reportKeys.shippingMargins(period),
    queryFn: () => requests.fetchShippingMargins(period),
  });
}
