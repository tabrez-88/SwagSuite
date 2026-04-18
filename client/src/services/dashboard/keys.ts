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
