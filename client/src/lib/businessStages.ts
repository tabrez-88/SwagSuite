// Business pipeline stages for project list view
// Consolidates stage determination logic used across table and kanban views

import type { Order } from "@shared/schema";

export type BusinessStage = "presentation" | "quote" | "sales_order" | "invoice";

export interface StageSubStatus {
  value: string;
  label: string;
  color: string; // Tailwind bg + text classes
  order: number; // Ordinal position within the stage
}

export interface StageConfig {
  id: BusinessStage;
  label: string;
  abbreviation: string;
  color: string;       // Badge background
  textColor: string;
  bgLight: string;     // Light background for kanban columns
  borderColor: string;
  strokeColor: string; // SVG ring color (hex)
  statuses: StageSubStatus[];
}

export interface DeterminedStage {
  stage: StageConfig;
  currentSubStatus: StageSubStatus;
  progressPercent: number;
}

export const BUSINESS_STAGES: Record<BusinessStage, StageConfig> = {
  presentation: {
    id: "presentation",
    label: "Presentation",
    abbreviation: "P",
    color: "bg-teal-500",
    textColor: "text-white",
    bgLight: "bg-teal-50",
    borderColor: "border-teal-200",
    strokeColor: "#14b8a6",
    statuses: [
      { value: "open", label: "Open", color: "bg-blue-100 text-blue-800", order: 1 },
      { value: "client_review", label: "Client Review", color: "bg-purple-100 text-purple-800", order: 2 },
      { value: "converted", label: "Converted", color: "bg-green-100 text-green-800", order: 3 },
      { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800", order: 4 },
    ],
  },
  quote: {
    id: "quote",
    label: "Quote",
    abbreviation: "Q",
    color: "bg-amber-500",
    textColor: "text-white",
    bgLight: "bg-amber-50",
    borderColor: "border-amber-200",
    strokeColor: "#f59e0b",
    statuses: [
      { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800", order: 1 },
      { value: "sent", label: "Sent to Client", color: "bg-blue-100 text-blue-800", order: 2 },
      { value: "approved", label: "Approved", color: "bg-green-100 text-green-800", order: 3 },
      { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800", order: 4 },
      { value: "expired", label: "Expired", color: "bg-yellow-100 text-yellow-800", order: 5 },
    ],
  },
  sales_order: {
    id: "sales_order",
    label: "Sales Order",
    abbreviation: "SO",
    color: "bg-blue-600",
    textColor: "text-white",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
    strokeColor: "#2563eb",
    statuses: [
      { value: "new", label: "New", color: "bg-blue-100 text-blue-800", order: 1 },
      { value: "pending_client_approval", label: "Pending Client Approval", color: "bg-yellow-100 text-yellow-800", order: 2 },
      { value: "client_change_requested", label: "Client Change Requested", color: "bg-orange-100 text-orange-800", order: 3 },
      { value: "client_approved", label: "Client Approved", color: "bg-green-100 text-green-800", order: 4 },
      { value: "in_production", label: "In Production", color: "bg-purple-100 text-purple-800", order: 5 },
      { value: "shipped", label: "Shipped", color: "bg-indigo-100 text-indigo-800", order: 6 },
      { value: "ready_to_invoice", label: "Ready To Be Invoiced", color: "bg-teal-100 text-teal-800", order: 7 },
    ],
  },
  invoice: {
    id: "invoice",
    label: "Invoice",
    abbreviation: "Inv",
    color: "bg-green-600",
    textColor: "text-white",
    bgLight: "bg-green-50",
    borderColor: "border-green-200",
    strokeColor: "#16a34a",
    statuses: [
      { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800", order: 1 },
      { value: "paid", label: "Paid", color: "bg-green-100 text-green-800", order: 2 },
      { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-800", order: 3 },
      { value: "cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-800", order: 4 },
    ],
  },
};

// Ordered array for kanban columns and sorting
export const STAGE_ORDER: BusinessStage[] = [
  "presentation",
  "quote",
  "sales_order",
  "invoice",
];

/**
 * Determines the current business pipeline stage for an order.
 * Priority-based: Invoice > Sales Order > Quote > Presentation (default)
 */
export function determineBusinessStage(order: Order): DeterminedStage {
  const o = order as any;

  // Priority 1: Invoice — salesOrderStatus is "ready_to_invoice"
  if (o.salesOrderStatus === "ready_to_invoice") {
    const stage = BUSINESS_STAGES.invoice;
    const subStatus = stage.statuses[0]; // "pending" by default
    return buildResult(stage, subStatus);
  }

  // Priority 2: Sales Order — orderType is sales_order or salesOrderStatus is set beyond default
  if (
    o.orderType === "sales_order" ||
    o.orderType === "rush_order" ||
    (o.salesOrderStatus && o.salesOrderStatus !== "new")
  ) {
    const stage = BUSINESS_STAGES.sales_order;
    const subStatus = stage.statuses.find((s) => s.value === (o.salesOrderStatus || "new")) || stage.statuses[0];
    return buildResult(stage, subStatus);
  }

  // Priority 3: Quote — quoteStatus is set beyond default
  if (o.quoteStatus && o.quoteStatus !== "draft") {
    const stage = BUSINESS_STAGES.quote;
    const subStatus = stage.statuses.find((s) => s.value === o.quoteStatus) || stage.statuses[0];
    return buildResult(stage, subStatus);
  }

  // Priority 4: Explicit starting stage via stageData
  // When a project is created starting at a higher stage, the status fields may still
  // be at defaults. Use stageData.startingStage to detect the intended stage.
  if (o.stageData?.startingStage) {
    const mapped: Record<string, BusinessStage> = {
      quote: "quote",
      estimate: "quote",
      sales_order: "sales_order",
    };
    const stageId = mapped[o.stageData.startingStage];
    if (stageId) {
      const stage = BUSINESS_STAGES[stageId];
      const statusField = stageId === "quote" ? o.quoteStatus : o.salesOrderStatus;
      const subStatus = stage.statuses.find((s) => s.value === (statusField || stage.statuses[0].value)) || stage.statuses[0];
      return buildResult(stage, subStatus);
    }
  }

  // Default: Presentation
  const stage = BUSINESS_STAGES.presentation;
  const subStatus = stage.statuses.find((s) => s.value === (o.presentationStatus || "open")) || stage.statuses[0];
  return buildResult(stage, subStatus);
}

function buildResult(stage: StageConfig, subStatus: StageSubStatus): DeterminedStage {
  // Calculate overall pipeline progress (not just within current stage)
  const stageIndex = STAGE_ORDER.indexOf(stage.id);
  const totalStages = STAGE_ORDER.length;
  const stageWeight = 1 / totalStages; // Each stage = 25% of total

  const totalStatuses = stage.statuses.length;
  const currentIndex = stage.statuses.findIndex((s) => s.value === subStatus.value);
  const withinStageProgress = totalStatuses > 1 ? (currentIndex + 1) / totalStatuses : 1;

  const progressPercent = Math.round(
    (stageIndex * stageWeight + withinStageProgress * stageWeight) * 100
  );

  return { stage, currentSubStatus: subStatus, progressPercent };
}

/**
 * Returns the PATCH payload for transitioning an order to a new business stage.
 * Sets the section-specific status to the first status of the target stage.
 */
export function getStageTransitionPayload(targetStage: BusinessStage): Record<string, string> {
  switch (targetStage) {
    case "presentation":
      return { presentationStatus: "open" };
    // Note: When converting FROM presentation TO quote/sales_order,
    // presentationStatus: "converted" is added in StageConversionDialog
    case "quote":
      return { quoteStatus: "sent" };
    case "sales_order":
      return { salesOrderStatus: "new", orderType: "sales_order" };
    case "invoice":
      return { salesOrderStatus: "ready_to_invoice" };
    default:
      return {};
  }
}
