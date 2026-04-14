export const productionKeys = {
  all: ["production"] as const,
  stages: ["/api/production/stages"] as const,
  nextActionTypes: ["/api/production/next-action-types"] as const,
  poReport: (params: string) => ["/api/production/po-report", params] as const,
  poReportDetail: (id: string | number) => [`/api/production/po-report/${id}`] as const,
  alerts: ["/api/production/alerts"] as const,
};
