export interface ShippingAccount {
  id: string;
  ownerType: "organization" | "company";
  ownerId: string | null;
  accountName: string;
  courier: "ups" | "fedex" | "usps" | "dhl" | "other";
  accountNumber: string;
  billingZip: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
