export const documentKeys = {
  byOrder: (orderId: string | number) => [`/api/orders/${orderId}/documents`] as const,
};
