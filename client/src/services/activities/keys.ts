export const activityKeys = {
  byOrder: (orderId: string | number) => [`/api/projects/${orderId}/activities`] as const,
};
