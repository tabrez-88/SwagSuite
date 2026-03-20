import type { useProjectData } from "../../hooks";

export interface OverviewSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
  isLocked?: boolean;
}

export interface TeamMemberPickerProps {
  role: string;
  field: "assignedUserId" | "csrUserId";
  currentUser: ReturnType<typeof useProjectData>["assignedUser"];
}
