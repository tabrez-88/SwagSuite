import type { ProjectData } from "@/types/project-types";

export interface ActivitiesSectionProps {
  orderId: string;
  data: ProjectData;
}

export interface PreviewFile {
  originalName: string;
  filePath: string;
  mimeType: string;
  fileName: string;
}
