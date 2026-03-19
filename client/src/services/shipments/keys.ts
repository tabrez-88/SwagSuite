export const shipmentKeys = {
  byOrder: (orderId: string | number) => [`/api/orders/${orderId}/shipments`] as const,
};
