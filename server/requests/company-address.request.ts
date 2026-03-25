import { z } from "zod";

export const createCompanyAddressRequest = z.object({
  addressName: z.string().optional(),
  companyNameOnDocs: z.string().optional(),
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default("US"),
  addressType: z.enum(["billing", "shipping", "both"]).default("both"),
  isDefault: z.boolean().default(false),
});

export type CreateCompanyAddressRequest = z.infer<typeof createCompanyAddressRequest>;

export const updateCompanyAddressRequest = createCompanyAddressRequest.partial();
export type UpdateCompanyAddressRequest = z.infer<typeof updateCompanyAddressRequest>;
