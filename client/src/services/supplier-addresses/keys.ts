export const supplierAddressKeys = {
  bySupplier: (supplierId: string) => [`/api/suppliers/${supplierId}/addresses`] as const,
  detail: (supplierId: string, addressId: string) =>
    [`/api/suppliers/${supplierId}/addresses/${addressId}`] as const,
};
