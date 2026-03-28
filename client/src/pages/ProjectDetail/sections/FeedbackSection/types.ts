import type { useProjectData } from "../../hooks";

export interface FeedbackSectionProps {
  projectId: string;
  data: ReturnType<typeof useProjectData>;
}
