import type { useProjectData } from "../../hooks";
import type { SectionLockStatus } from "@/hooks/useLockStatus";

export interface QuoteSectionProps {
  projectId: string;
  data: ReturnType<typeof useProjectData>;
  lockStatus?: SectionLockStatus;
}

export const quoteStatuses = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "sent", label: "Sent to Client", color: "bg-blue-100 text-blue-800" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "expired", label: "Expired", color: "bg-yellow-100 text-yellow-800" },
];

// getEditedItem is now in @/lib/projectDetailUtils
