export const presentationKeys = {
  all: ["/api/presentations"] as const,
  detail: (id: string) => [`/api/presentations/${id}`] as const,
};
