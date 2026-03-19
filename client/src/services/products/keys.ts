export const productKeys = {
  all: ["/api/products"] as const,
  detail: (id: string | number) => [`/api/products/${id}`] as const,
  orders: (id: string | number) => [`/api/products/${id}/orders`] as const,
  popular: ["/api/products/popular"] as const,
  suggested: ["/api/products/suggested"] as const,
};
