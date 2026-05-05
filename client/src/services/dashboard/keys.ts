export const dashboardKeys = {
  all: ["dashboard"] as const,
  enhancedStats: (_range?: string) =>
    ["/api/dashboard/enhanced-stats"] as const,
  teamLeaderboard: (_range?: string) =>
    ["/api/dashboard/team-leaderboard"] as const,
  recentActivities: ["/api/dashboard/recent-activities"] as const,
  automationTasks: ["/api/dashboard/automation-tasks"] as const,
  newsAlerts: ["/api/dashboard/news-alerts"] as const,
};
