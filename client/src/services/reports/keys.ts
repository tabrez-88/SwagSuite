export const reportKeys = {
  all: ["reports"] as const,
  leadSources: ["/api/reports/lead-sources"] as const,
  templates: ["/api/reports/templates"] as const,
  suggestions: ["/api/reports/suggestions"] as const,
  recent: ["/api/reports/recent"] as const,
  projectReport: (filters?: unknown) =>
    filters ? (["/api/projects/report", filters] as const) : (["/api/projects/report"] as const),
  dashboardStats: ["/api/dashboard/stats"] as const,
  teamPerformance: ["/api/dashboard/team-performance"] as const,
  arAging: ["/api/reports/accounts-receivable"] as const,
  commissions: (from?: string, to?: string) =>
    ["/api/reports/commissions", { from, to }] as const,
};
