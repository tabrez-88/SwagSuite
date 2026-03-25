export interface CompanyAddress {
  id: string;
  companyId: string;
  addressName: string | null;
  companyNameOnDocs: string | null;
  street: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  addressType: "billing" | "shipping" | "both";
  isDefault: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type CreateCompanyAddress = Omit<CompanyAddress, "id" | "companyId" | "createdAt" | "updatedAt">;
export type UpdateCompanyAddress = Partial<CreateCompanyAddress>;
