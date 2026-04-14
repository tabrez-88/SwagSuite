export const companyKeys = {
  all: ["/api/companies"] as const,
  detail: (id: string | number) => [`/api/companies/${id}`] as const,
  spending: (id: string | number, from?: string, to?: string) =>
    [`/api/companies/${id}/spending`, { from, to }] as const,
  activities: (id: string | number) => [`/api/companies/${id}/activities`] as const,
  projects: (id: string | number) => [`/api/companies/${id}/projects`] as const,
};
