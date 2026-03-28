import type { ProjectData } from "@/types/project-types";

export interface ProductsSectionProps {
  projectId: string;
  data: ProjectData;
  isLocked?: boolean;
}
