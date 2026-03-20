export interface ShippingAddress {
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Non-Profit",
  "Government",
  "Entertainment",
  "Real Estate",
  "Construction",
  "Transportation",
  "Food & Beverage",
  "Professional Services",
  "Other",
];

export const ENGAGEMENT_COLORS = {
  high: "bg-green-100 text-green-800 hover:bg-green-200",
  medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  low: "bg-red-100 text-red-800 hover:bg-red-200",
  undefined: "bg-gray-100 text-gray-800 hover:bg-gray-200",
};
