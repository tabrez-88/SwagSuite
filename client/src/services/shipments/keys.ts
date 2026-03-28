export const shipmentKeys = {
  byOrder: (projectId: string | number) => [`/api/projects/${projectId}/shipments`] as const,
};
