// PO statuses & proof statuses — single source of truth
// PO lifecycle stages are now dynamic from production_stages DB table
// Use useProductionStages() hook for stage data

export interface POStatusConfig {
  key: string;
  label: string;
  color: string;
  bgColor: string;
}

export interface ProofStatusConfig {
  key: string;
  label: string;
  color: string;
  bgColor: string;
}

// PO Status (urgency overlay)
export const PO_STATUSES: Record<string, POStatusConfig> = {
  ok: { key: "ok", label: "OK", color: "text-green-700", bgColor: "bg-green-100" },
  follow_up: { key: "follow_up", label: "Follow Up", color: "text-yellow-800", bgColor: "bg-yellow-100" },
  problem: { key: "problem", label: "Problem", color: "text-red-800", bgColor: "bg-red-100" },
};

// Proof Statuses (CommonSKU flow)
export const PROOF_STATUSES: Record<string, ProofStatusConfig> = {
  pending: { key: "pending", label: "Pending", color: "text-gray-700", bgColor: "bg-gray-100" },
  awaiting_proof: { key: "awaiting_proof", label: "Awaiting Proof", color: "text-yellow-800", bgColor: "bg-yellow-100" },
  proof_received: { key: "proof_received", label: "Proof Received", color: "text-blue-800", bgColor: "bg-blue-100" },
  pending_approval: { key: "pending_approval", label: "Pending Approval", color: "text-orange-800", bgColor: "bg-orange-100" },
  approved: { key: "approved", label: "Approved", color: "text-green-800", bgColor: "bg-green-100" },
  change_requested: { key: "change_requested", label: "Change Requested", color: "text-red-800", bgColor: "bg-red-100" },
  proofing_complete: { key: "proofing_complete", label: "Proofing Complete", color: "text-teal-800", bgColor: "bg-teal-100" },
};

// Active proof statuses (not complete/pending)
export const PROOF_ACTIVE_STATUSES = ["awaiting_proof", "proof_received", "pending_approval", "change_requested"];

// Helper: get badge class string for Shadcn Badge variant="outline"
export function getPOStatusBadgeClass(status: string): string {
  const config = PO_STATUSES[status];
  return config ? `${config.bgColor} ${config.color} border-0` : "bg-gray-100 text-gray-700 border-0";
}

export function getProofStatusBadgeClass(status: string): string {
  const config = PROOF_STATUSES[status];
  return config ? `${config.bgColor} ${config.color} border-0` : "bg-gray-100 text-gray-700 border-0";
}
