/**
 * Standard hook pattern for Project Detail sections
 * Separates: data fetching → mutations → UI state management
 *
 * This prevents code duplication and ensures consistent error handling,
 * loading states, and activity logging across all sections.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProject, deleteByEndpoint } from "@/services/projects/requests";
import { useToast } from "./use-toast";
import { projectKeys } from "@/services/projects/keys";
import type { SectionContext } from "@/lib/projectDetailUtils";

interface UseSectionMutationOptions {
  projectId: string;
  section: SectionContext;
  isLocked?: boolean;
}

/**
 * Standard mutation hook for any section field update
 * Handles: API call + invalidation + error toast
 */
export function useSectionFieldUpdate({ projectId, section, isLocked = false }: UseSectionMutationOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (isLocked) throw new Error("Section is locked");
      await updateProject(projectId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to update ${section}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

interface UseSectionDeleteOptions extends Omit<UseSectionMutationOptions, "isLocked"> {
  endpoint: string;
  itemName?: string;
}

/**
 * Standard mutation hook for section item deletion
 */
export function useSectionItemDelete({ projectId, section, endpoint, itemName = "item" }: UseSectionDeleteOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (itemId: string | number) =>
      deleteByEndpoint(endpoint.replace(":id", String(itemId))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.itemsWithDetails(projectId) });
      toast({ title: `${itemName} removed` });
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to delete ${itemName}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for tracking UI state (dialogs, modals, expanded items)
 * Keep UI state separate from data mutations
 */
export function useSectionUIState() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEditing = (id: string) => setEditingId(id);
  const stopEditing = () => setEditingId(null);

  return {
    expandedItems,
    setExpandedItems,
    editingId,
    startEditing,
    stopEditing,
    isDialogOpen,
    setIsDialogOpen,
    toggleExpand,
  };
}

export { useInlineEdit } from "./useInlineEdit";
