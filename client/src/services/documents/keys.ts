export const documentKeys = {
  byOrder: (projectId: string | number) => [`/api/projects/${projectId}/documents`] as const,
};
