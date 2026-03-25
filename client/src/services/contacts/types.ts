export interface Contact {
  id: string;
  companyId?: string;
  supplierId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  department?: string;
  noMarketing?: boolean;
  isActive?: boolean;
  isPrimary?: boolean;
  leadSource?: string;
  createdAt?: string;
  updatedAt?: string;
  companyName?: string;
  supplierName?: string;
}
