export const sequenceKeys = {
  all: ["/api/sequences"] as const,
  detail: (id: string) => [`/api/sequences/${id}`] as const,
  enrollments: ["/api/sequence-enrollments"] as const,
};
