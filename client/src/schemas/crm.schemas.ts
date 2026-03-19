import { z } from "zod";

// ── Company ──────────────────────────────────────────────

export const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
  // Social media links
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
  facebookUrl: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
  otherSocialUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type CompanyFormData = z.infer<typeof companyFormSchema>;

// ── Contact (standalone / CRM contacts page) ────────────

export const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
  leadSource: z.string().optional(),
  isPrimary: z.boolean().default(false),
  associationType: z.enum(["company", "vendor", "none"]).default("none"),
  companyId: z.string().optional(),
  supplierId: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// ── Contact (vendor context — has receiveOrderEmails) ───

export const vendorContactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
  isPrimary: z.boolean().default(false),
  receiveOrderEmails: z.boolean().default(true),
});

export type VendorContactFormData = z.infer<typeof vendorContactFormSchema>;

// ── Contact (inline manager — has billing/shipping) ─────

export const contactManagerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
  isPrimary: z.boolean().default(false),
  billingStreet: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZipCode: z.string().optional(),
  billingCountry: z.string().optional(),
  shippingStreet: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZipCode: z.string().optional(),
  shippingCountry: z.string().optional(),
});

export type ContactManagerFormData = z.infer<typeof contactManagerFormSchema>;

// ── Vendor ───────────────────────────────────────────────

export const vendorFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  isPreferred: z.boolean().default(false),
  doNotOrder: z.boolean().default(false),
  eqpPricing: z.number().optional(),
  rebatePercentage: z.number().optional(),
  freeSetups: z.boolean().default(false),
  freeSpecSamples: z.boolean().default(false),
  freeSelfPromo: z.boolean().default(false),
  reducedSpecSamples: z.boolean().default(false),
});

export type VendorFormData = z.infer<typeof vendorFormSchema>;

// ── Lead ─────────────────────────────────────────────────

export const leadFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  source: z.string().min(1, "Lead source is required"),
  status: z.string().min(1, "Lead status is required"),
  estimatedValue: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  notes: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
