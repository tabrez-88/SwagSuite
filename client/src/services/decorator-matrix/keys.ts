export const matrixKeys = {
  all: ["/api/matrices"] as const,
  detail: (id: string) => [`/api/matrices/${id}`] as const,
  bySupplier: (supplierId: string) => [`/api/suppliers/${supplierId}/matrices`] as const,
};
