export const purchaseOrderKeys = {
  all: ["/api/purchase-orders"] as const,
  byOrder: (orderId: string) => [`/api/orders/${orderId}/purchase-orders`] as const,
};
