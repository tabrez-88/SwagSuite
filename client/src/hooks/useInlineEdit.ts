import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProject } from "@/services/projects/requests";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "@/services/projects/keys";
import { calcSupplierInHandsDate } from "@/lib/dateUtils";

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
      // Auto-calculate supplierInHandsDate when inHandsDate changes
      if (fields.inHandsDate && !fields.supplierInHandsDate) {
        fields = { ...fields, supplierInHandsDate: new Date(calcSupplierInHandsDate(fields.inHandsDate)) };
      }
      await updateProject(projectId, fields);
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
