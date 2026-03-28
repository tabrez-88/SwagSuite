import type { useProjectData } from "../../hooks";
import type { SectionLockStatus } from "@/hooks/useLockStatus";

export interface SalesOrderSectionProps {
  projectId: string;
  data: ReturnType<typeof useProjectData>;
  lockStatus?: SectionLockStatus;
}

export const salesOrderStatuses = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "pending_client_approval", label: "Pending Client Approval", color: "bg-yellow-100 text-yellow-800" },
  { value: "client_change_requested", label: "Client Change Requested", color: "bg-orange-100 text-orange-800" },
  { value: "client_approved", label: "Client Approved", color: "bg-green-100 text-green-800" },
  { value: "in_production", label: "In Production", color: "bg-purple-100 text-purple-800" },
  { value: "shipped", label: "Shipped", color: "bg-indigo-100 text-indigo-800" },
  { value: "ready_to_invoice", label: "Ready To Be Invoiced", color: "bg-teal-100 text-teal-800" },
];

export const proofStatuses: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  awaiting_proof: { label: "Awaiting Proof", color: "bg-yellow-100 text-yellow-800" },
  proof_received: { label: "Proof Received", color: "bg-blue-100 text-blue-800" },
  pending_approval: { label: "Pending Approval", color: "bg-orange-100 text-orange-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  change_requested: { label: "Change Requested", color: "bg-red-100 text-red-800" },
  proofing_complete: { label: "Proofing Complete", color: "bg-teal-100 text-teal-800" },
};
