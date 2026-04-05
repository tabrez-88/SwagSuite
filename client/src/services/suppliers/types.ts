export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  contactPerson?: string;
  paymentTerms?: string;
  defaultTerms?: string;
  accountNumber?: string;
  notes?: string;
  isPreferred?: boolean;
  doNotOrder?: boolean;
  ytdSpend?: number;
  lastYearSpend?: number;
  productCount?: number;
  lastOrderDate?: string;
  apiIntegrationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  preferredBenefits?: PreferredBenefits;
}

export interface PreferredBenefits {
  eqpPricing?: number;
  rebatePercentage?: number;
  freeSetups?: boolean;
  reducedSpecSamples?: boolean;
  freeSpecSamples?: boolean;
  reducedSelfPromo?: boolean;
  freeSelfPromo?: boolean;
  ytdEqpSavings?: number;
  ytdRebates?: number;
  selfPromosSent?: number;
  specSamplesSent?: number;
}

export interface VendorContact {
  id: string;
  supplierId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  department?: string;
  noMarketing?: boolean;
  isActive?: boolean;
  isPrimary?: boolean;
  receiveOrderEmails?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
