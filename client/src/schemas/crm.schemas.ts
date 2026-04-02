import { z } from "zod";

// ── Company ──────────────────────────────────────────────

const urlField = (label = "URL") =>
  z.string()
    .transform((v) => {
      if (!v) return v;
      return /^https?:\/\//i.test(v) ? v : `https://${v}`;
    })
    .pipe(z.string().url(`Invalid ${label}`))
    .optional()
    .or(z.literal(""));

export const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: urlField("website URL"),
  industry: z.string().optional(),
  notes: z.string().optional(),
  taxExempt: z.boolean().optional(),
  defaultTaxCodeId: z.string().optional().or(z.literal("")),
  // Social media links
  linkedinUrl: urlField("LinkedIn URL"),
  twitterUrl: urlField("Twitter URL"),
  facebookUrl: urlField("Facebook URL"),
  instagramUrl: urlField("Instagram URL"),
  otherSocialUrl: urlField("URL"),
});

export type CompanyFormData = z.infer<typeof companyFormSchema>;

// ── Contact (standalone / CRM contacts page) ────────────

export const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  noMarketing: z.boolean().default(false),
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
  department: z.string().optional(),
  noMarketing: z.boolean().default(false),
  isPrimary: z.boolean().default(false),
  receiveOrderEmails: z.boolean().default(true),
});

export type VendorContactFormData = z.infer<typeof vendorContactFormSchema>;

// ── Contact (inline manager) ─────

export const CONTACT_DEPARTMENTS = [
  "Executive",
  "Sales",
  "Marketing",
  "Accounting",
  "Purchasing",
  "Design",
  "Operations",
  "IT",
  "HR",
  "Administration",
  "Other",
] as const;

export const contactManagerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  noMarketing: z.boolean().default(false),
  isPrimary: z.boolean().default(false),
});

export type ContactManagerFormData = z.infer<typeof contactManagerFormSchema>;

// ── Vendor ───────────────────────────────────────────────

export const vendorFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
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
