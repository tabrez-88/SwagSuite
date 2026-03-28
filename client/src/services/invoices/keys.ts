export const invoiceKeys = {
  byOrder: (projectId: string | number) => [`/api/projects/${projectId}/invoice`] as const,
};
