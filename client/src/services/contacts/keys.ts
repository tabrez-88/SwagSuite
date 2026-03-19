export const contactKeys = {
  all: ["/api/contacts"] as const,
  detail: (id: string | number) => [`/api/contacts/${id}`] as const,
  byCompany: (companyId: string | number) => ["/api/contacts", "company", companyId] as const,
  bySupplier: (supplierId: string | number) => ["/api/contacts", "vendor", supplierId] as const,
};
