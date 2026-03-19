export const communicationKeys = {
  byOrder: (orderId: string | number, type?: string) =>
    type
      ? [`/api/orders/${orderId}/communications`, { type }] as const
      : [`/api/orders/${orderId}/communications`] as const,
};
