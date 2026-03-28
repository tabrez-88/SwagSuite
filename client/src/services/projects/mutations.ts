import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "./keys";
import * as requests from "./requests";

export function useUpdateProject(projectId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Record<string, any>) => requests.updateProject(projectId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
  });
}

export function useDuplicateProject(projectId: string | number) {
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => requests.duplicateProject(projectId),
    onSuccess: (data: any) => {
      toast({ title: "Project duplicated!", description: `New project #${data.orderNumber || ""}` });
    },
    onError: () => toast({ title: "Failed to duplicate project", variant: "destructive" }),
  });
}

export function useRecalculateTotal(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => requests.recalculateTotal(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast({ title: "Total recalculated" });
    },
    onError: () => toast({ title: "Failed to recalculate total", variant: "destructive" }),
  });
}
