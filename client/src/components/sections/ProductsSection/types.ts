import type { ProjectData } from "@/types/project-types";

export interface ProductsSectionProps {
  orderId: string;
  data: ProjectData;
  isLocked?: boolean;
}
