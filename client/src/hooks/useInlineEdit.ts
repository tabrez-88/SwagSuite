import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "@/services/projects/keys";

interface UseInlineEditOptions {
  projectId: string;
  isLocked?: boolean;
}

export function useInlineEdit({ projectId, isLocked = false }: UseInlineEditOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateFieldMutation = useMutation({
    mutationFn: async (fields: Record<string, any>) => {
      if (isLocked) throw new Error("Section is locked");
      const res = await apiRequest("PATCH", `/api/projects/${projectId}`, fields);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });

  return {
    updateField: updateFieldMutation.mutate,
    isPending: updateFieldMutation.isPending,
    isLocked,
  };
}
