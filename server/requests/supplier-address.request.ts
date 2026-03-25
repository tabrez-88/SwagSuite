import { z } from "zod";

export const createSupplierAddressRequest = z.object({
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

export type CreateSupplierAddressRequest = z.infer<typeof createSupplierAddressRequest>;

export const updateSupplierAddressRequest = createSupplierAddressRequest.partial();
export type UpdateSupplierAddressRequest = z.infer<typeof updateSupplierAddressRequest>;
