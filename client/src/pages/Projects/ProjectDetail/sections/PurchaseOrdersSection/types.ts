import type { ProjectData, OrderVendor } from "@/types/project-types";
import type { OrderItemLine, GeneratedDocument } from "@shared/schema";
import type { EnrichedOrderItem } from "@/types/project-types";

export interface PurchaseOrdersSectionProps {
  projectId: string;
  data: ProjectData;
  isLocked?: boolean;
}

/** Artwork enriched with product context for proofing display */
export interface VendorArtwork {
  id: string;
  name?: string;
  status: string;
  orderItemId: string;
  productName: string;
  supplierName: string;
  proofRequired?: boolean | null;
  proofFilePath?: string | null;
  proofFileName?: string | null;
  filePath?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  location?: string | null;
  artworkType?: string | null;
  [key: string]: unknown;
}

export interface VendorPO {
  groupKey: string;
  vendor: OrderVendor;
  items: EnrichedOrderItem[];
  lines: Record<string, OrderItemLine[]>;
  totalQty: number;
  totalCost: number;
  label: string;
  shipToAddress: Record<string, unknown> | null;
  shipInHandsDate: string | null;
  shipFirm: boolean | null;
  shippingMethod: string | null;
  shippingAccountId: string | null;
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
