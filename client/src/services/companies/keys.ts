export const companyKeys = {
  all: ["/api/companies"] as const,
  detail: (id: string | number) => [`/api/companies/${id}`] as const,
};
