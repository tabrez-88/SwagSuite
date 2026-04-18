export type ImprintOptionType = "location" | "method";

export interface ImprintOption {
  id: string;
  type: ImprintOptionType;
  value: string;
  label: string;
  displayOrder: number;
  isActive: boolean;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ImprintOptionSuggestion {
  id: string;
  type: ImprintOptionType;
  label: string;
  normalizedLabel: string;
  suggestedBy: string | null;
  suggestedFromOrderId: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  approvedOptionId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}
