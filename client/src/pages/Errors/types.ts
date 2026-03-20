import type { Error, InsertError } from "@shared/schema";
import type { UseFormReturn } from "react-hook-form";

export interface ErrorFormProps {
  form: UseFormReturn<InsertError>;
  onSubmit: (data: InsertError) => void;
  isLoading: boolean;
  selectedError: Error | null;
}

export interface ChartDataItem {
  name: string;
  value: number;
}

export interface CostDataItem {
  party: string;
  cost: number;
}

export interface UseErrorsReturn {
  // State
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  selectedError: Error | null;
  setSelectedError: (error: Error | null) => void;
  isLoading: boolean;

  // Data
  errors: Error[];
  totalErrors: number;
  resolvedErrors: number;
  unresolvedErrors: number;
  totalCost: number;

  // Chart data
  typeChartData: ChartDataItem[];
  partyChartData: ChartDataItem[];
  costData: CostDataItem[];
  COLORS: string[];

  // Form
  form: UseFormReturn<InsertError>;
  onSubmit: (data: InsertError) => void;

  // Mutations
  createErrorMutation: { isPending: boolean };
  updateErrorMutation: { isPending: boolean };
  resolveErrorMutation: { isPending: boolean; mutate: (id: string) => void };

  // Helpers
  formatErrorType: (type: string) => string;
  formatResponsibleParty: (party: string) => string;
  getErrorTypeBadge: (type: string) => string;
  getResponsiblePartyBadge: (party: string) => string;

  // Edit handler
  handleEdit: (error: Error) => void;
}
