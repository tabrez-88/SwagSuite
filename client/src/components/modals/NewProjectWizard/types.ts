import type { Company } from "@shared/schema";

export interface NewProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCompanyId?: string;
}

export type StartingStage = "presentation" | "quote" | "sales_order";

export const WIZARD_STAGES: { id: StartingStage; label: string; abbreviation: string; description: string }[] = [
  { id: "presentation", label: "Presentation", abbreviation: "P", description: "Start with a product presentation for your client" },
  { id: "quote", label: "Quote", abbreviation: "Q", description: "Create a quote with billing & shipping details" },
  { id: "sales_order", label: "Sales Order", abbreviation: "SO", description: "Jump straight to a confirmed sales order" },
];

export type { Company };
