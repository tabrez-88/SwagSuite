export const companyAddressKeys = {
  byCompany: (companyId: string) => [`/api/companies/${companyId}/addresses`] as const,
  detail: (companyId: string, addressId: string) =>
    [`/api/companies/${companyId}/addresses/${addressId}`] as const,
};
