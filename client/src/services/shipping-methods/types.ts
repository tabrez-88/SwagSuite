export interface ShippingMethod {
  id: string;
  name: string;
  courier: "ups" | "fedex" | "usps" | "dhl" | "other";
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
