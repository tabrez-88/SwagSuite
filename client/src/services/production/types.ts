import type { ProductionStage } from "@/constants/productionStages";

export type { ProductionStage };

export interface NextActionType {
  id: string;
  name: string;
  order: number;
  color: string;
  description?: string | null;
  icon: string;
  isActive?: boolean | null;
}

export interface StageInput {
  name: string;
  description?: string;
  color: string;
  icon: string;
}

export interface StageUpdate {
  id: string;
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isInitial?: boolean;
  isFinal?: boolean;
  onEmailSent?: boolean;
  onVendorConfirm?: boolean;
  onBilling?: boolean;
}
