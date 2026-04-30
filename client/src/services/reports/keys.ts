export const reportKeys = {
  all: ["reports"] as const,
  leadSources: ["/api/reports/lead-sources"] as const,
  suggestions: ["/api/reports/suggestions"] as const,
  projectReport: (filters?: unknown) =>
    filters ? (["/api/projects/report", filters] as const) : (["/api/projects/report"] as const),
  dashboardStats: ["/api/dashboard/stats"] as const,
  teamPerformance: ["/api/dashboard/team-performance"] as const,
  arAging: ["/api/reports/accounts-receivable"] as const,
  commissions: (from?: string, to?: string) =>
    ["/api/reports/commissions", { from, to }] as const,
  shippingMargins: (period: string) =>
    ["/api/dashboard/shipping-margins", { period }] as const,
};
