import type { useProjectData } from "../../hooks";

export interface FeedbackSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}
