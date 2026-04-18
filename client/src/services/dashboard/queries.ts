import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "./keys";

export function useEnhancedStats<T = any>(range?: string) {
  return useQuery<T>({
    queryKey: dashboardKeys.enhancedStats(range),
    refetchInterval: 60_000,
  });
}

export function useTeamLeaderboard<T = any>(range?: string) {
  return useQuery<T>({
    queryKey: dashboardKeys.teamLeaderboard(range),
    refetchInterval: 300_000,
  });
}

export function useAutomationTasks<T = any>() {
  return useQuery<T>({
    queryKey: dashboardKeys.automationTasks,
    refetchInterval: 30_000,
  });
}

export function useNewsAlerts<T = any>() {
  return useQuery<T>({
    queryKey: dashboardKeys.newsAlerts,
    refetchInterval: 300_000,
  });
}
