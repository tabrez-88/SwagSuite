import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  enhancedStats: (range?: string) =>
    range
      ? (["/api/dashboard/enhanced-stats", { range }] as const)
      : (["/api/dashboard/enhanced-stats"] as const),
  teamLeaderboard: (range?: string) =>
    range
      ? (["/api/dashboard/team-leaderboard", { range }] as const)
      : (["/api/dashboard/team-leaderboard"] as const),
  automationTasks: ["/api/dashboard/automation-tasks"] as const,
  newsAlerts: ["/api/dashboard/news-alerts"] as const,
};

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

export async function seedDummyData(): Promise<any> {
  const res = await apiRequest("POST", "/api/seed-dummy-data", {});
  return res.json();
}

export function useSeedDummyData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seedDummyData,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
