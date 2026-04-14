/**
 * This file used to hold the ~280-line `useProjectData` aggregator. That logic
 * has moved to `@/services/projects/useProjectData` to keep react-query calls
 * out of page code. This module stays as a thin re-export so existing imports
 * (`from "./hooks"`) keep working.
 */
export { useProjectData } from "@/services/projects";

// Re-export project-related types for backward compatibility with older imports.
export type {
  TeamMember,
  ProjectActivity,
  Communication,
  ProjectData,
} from "@/types/project-types";
