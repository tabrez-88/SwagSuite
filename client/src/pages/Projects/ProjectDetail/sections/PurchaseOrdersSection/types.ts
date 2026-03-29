import type { ProjectData } from "@/types/project-types";
import type { OrderItemLine } from "@shared/schema";

export interface PurchaseOrdersSectionProps {
  projectId: string;
  data: ProjectData;
  isLocked?: boolean;
}

export interface VendorPO {
  vendor: any;
  items: any[];
  lines: Record<string, OrderItemLine[]>;
  totalQty: number;
  totalCost: number;
}

// PO Status (urgency)
export const PO_STATUSES: Record<string, { label: string; color: string }> = {
  ok: { label: "OK", color: "bg-green-100 text-green-700" },
  follow_up: { label: "Follow Up", color: "bg-yellow-100 text-yellow-800" },
  problem: { label: "Problem", color: "bg-red-100 text-red-800" },
};

// Proof statuses (CommonSKU flow)
export const PROOF_STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  awaiting_proof: { label: "Awaiting Proof", color: "bg-yellow-100 text-yellow-800" },
  proof_received: { label: "Proof Received", color: "bg-blue-100 text-blue-800" },
  pending_approval: { label: "Pending Approval", color: "bg-orange-100 text-orange-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  change_requested: { label: "Change Requested", color: "bg-red-100 text-red-800" },
  proofing_complete: { label: "Proofing Complete", color: "bg-teal-100 text-teal-800" },
};
