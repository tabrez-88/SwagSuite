import { useQuery } from "@tanstack/react-query";
import { projectKeys } from "./keys";

export function useProjects<T = any[]>() {
  return useQuery<T>({ queryKey: projectKeys.all });
}

export function useProject<T = any>(projectId: string | number) {
  return useQuery<T>({ queryKey: projectKeys.detail(projectId), enabled: !!projectId });
}
