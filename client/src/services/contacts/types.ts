export interface Contact {
  id: string;
  companyId?: string;
  supplierId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  isPrimary?: boolean;
  leadSource?: string;
  billingAddress?: string;
  shippingAddress?: string;
  createdAt?: string;
  updatedAt?: string;
  companyName?: string;
  supplierName?: string;
}
