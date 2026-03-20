export type PresentationStatus = "draft" | "generating" | "completed" | "error";

export interface PresentationData {
  id: string;
  title: string;
  description?: string;
  dealNotes?: string;
  hubspotDealId?: string;
  suggestedProducts: any[];
  slides: any[];
  status: PresentationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestedProduct {
  id: string;
  productName: string;
  suggestedPrice: number;
  suggestedQuantity: number;
  reasoning: string;
  isIncluded: boolean;
}
