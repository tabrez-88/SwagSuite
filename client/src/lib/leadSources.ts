export const LEAD_SOURCES = [
  "Website",
  "Referral",
  "Cold Call",
  "Email Campaign",
  "Trade Show",
  "Social Media",
  "Google Ads",
  "Partner",
  "Other",
] as const;

export type LeadSource = typeof LEAD_SOURCES[number];
