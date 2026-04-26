export const shippingAccountKeys = {
  org: ["/api/shipping-accounts"] as const,
  company: (companyId: string) => [`/api/shipping-accounts/company/${companyId}`] as const,
};
