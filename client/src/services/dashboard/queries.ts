import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "./keys";
import type {
  DashboardMetrics,
  TeamLeaderboard,
  AIAutomationTask,
  NewsAlert,
} from "@/pages/Home/components/EnhancedDashboard/types";

export function useEnhancedStats(range?: string) {
  return useQuery<DashboardMetrics>({
    queryKey: dashboardKeys.enhancedStats(range),
    refetchInterval: 60_000,
  });
}

export function useTeamLeaderboard(range?: string) {
  return useQuery<TeamLeaderboard[]>({
    queryKey: dashboardKeys.teamLeaderboard(range),
    refetchInterval: 300_000,
  });
}

export function useAutomationTasks() {
  return useQuery<AIAutomationTask[]>({
    queryKey: dashboardKeys.automationTasks,
    refetchInterval: 30_000,
  });
}

export function useNewsAlerts() {
  return useQuery<NewsAlert[]>({
    queryKey: dashboardKeys.newsAlerts,
    refetchInterval: 300_000,
  });
}
