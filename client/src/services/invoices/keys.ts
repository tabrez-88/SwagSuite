export const invoiceKeys = {
  byOrder: (orderId: string | number) => [`/api/orders/${orderId}/invoice`] as const,
};
