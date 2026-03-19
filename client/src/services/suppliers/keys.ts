export const supplierKeys = {
  all: ["/api/suppliers"] as const,
  detail: (id: string | number) => [`/api/suppliers/${id}`] as const,
  contacts: (id: string | number) => ["/api/contacts", "vendor", id] as const,
  products: (id: string | number) => ["/api/products", "vendor", id] as const,
};
