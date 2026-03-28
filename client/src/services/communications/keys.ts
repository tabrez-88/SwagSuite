export const communicationKeys = {
  byOrder: (projectId: string | number, type?: string) =>
    type
      ? [`/api/projects/${projectId}/communications`, { type }] as const
      : [`/api/projects/${projectId}/communications`] as const,
};
