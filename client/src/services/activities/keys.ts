export const activityKeys = {
  byOrder: (projectId: string | number) => [`/api/projects/${projectId}/activities`] as const,
  infinite: (projectId: string | number) => [`/api/projects/${projectId}/activities`, "infinite"] as const,
};
