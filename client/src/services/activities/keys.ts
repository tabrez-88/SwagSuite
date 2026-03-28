export const activityKeys = {
  byOrder: (projectId: string | number) => [`/api/projects/${projectId}/activities`] as const,
};
