import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "@/services/projects/keys";
import * as requests from "./requests";

function useInvalidateProjectItems(projectId: string | number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: projectKeys.itemsWithDetails(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.itemLines(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.itemCharges(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.artworks(projectId) });
  };
}

export function useDuplicateProjectItem(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: (itemId: string | number) =>
      requests.duplicateProjectItem(projectId, itemId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Product duplicated", description: "A copy has been added to this project." });
    },
    onError: () => toast({ title: "Failed to duplicate product", variant: "destructive" }),
  });
}

export function useDeleteProjectItem(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: (itemId: string | number) =>
      requests.deleteProjectItem(projectId, itemId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Item removed", description: "Product has been removed from this project." });
    },
    onError: () => toast({ title: "Failed to remove item", variant: "destructive" }),
  });
}

export function useUpdateProjectItem(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string | number; updates: Record<string, any> }) =>
      requests.updateProjectItem(projectId, itemId, updates),
    onSuccess: () => {
      invalidate();
      toast({ title: "Item updated", description: "Product details have been saved." });
    },
    onError: () => toast({ title: "Failed to update item", variant: "destructive" }),
  });
}

export function useAddLine(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ orderItemId, line }: { orderItemId: string | number; line: Record<string, any> }) =>
      requests.addLine(orderItemId, line),
    onSuccess: () => {
      invalidate();
      toast({ title: "Line added" });
    },
    onError: () => toast({ title: "Failed to add line", variant: "destructive" }),
  });
}

export function useUpdateLine(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ orderItemId, lineId, updates }: { orderItemId: string | number; lineId: string | number; updates: Record<string, any> }) =>
      requests.updateLine(orderItemId, lineId, updates),
    onSuccess: () => {
      invalidate();
      toast({ title: "Line updated" });
    },
    onError: () => toast({ title: "Failed to update line", variant: "destructive" }),
  });
}

export function useDeleteLine(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ orderItemId, lineId }: { orderItemId: string | number; lineId: string | number }) =>
      requests.deleteLine(orderItemId, lineId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Line removed" });
    },
    onError: () => toast({ title: "Failed to remove line", variant: "destructive" }),
  });
}

export function useAddCharge(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ orderItemId, charge }: { orderItemId: string | number; charge: Record<string, any> }) =>
      requests.addCharge(orderItemId, charge),
    onSuccess: () => {
      invalidate();
      toast({ title: "Charge added" });
    },
    onError: () => toast({ title: "Failed to add charge", variant: "destructive" }),
  });
}

export function useDeleteCharge(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ orderItemId, chargeId }: { orderItemId: string | number; chargeId: string | number }) =>
      requests.deleteCharge(orderItemId, chargeId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Charge removed" });
    },
    onError: () => toast({ title: "Failed to remove charge", variant: "destructive" }),
  });
}

export function useUpdateCharge(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ orderItemId, chargeId, updates }: { orderItemId: string | number; chargeId: string | number; updates: Record<string, any> }) =>
      requests.updateCharge(orderItemId, chargeId, updates),
    onSuccess: () => {
      invalidate();
      toast({ title: "Charge updated" });
    },
    onError: () => toast({ title: "Failed to update charge", variant: "destructive" }),
  });
}

export function useToggleChargeDisplay(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ orderItemId, chargeId, displayToClient }: { orderItemId: string | number; chargeId: string | number; displayToClient: boolean }) =>
      requests.updateCharge(orderItemId, chargeId, { displayToClient }),
    onSuccess: () => invalidate(),
    onError: () => toast({ title: "Failed to update charge", variant: "destructive" }),
  });
}

export function useCreateArtwork(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ orderItemId, ...data }: { orderItemId: string | number; name: string; filePath: string; fileName: string; location?: string; artworkType?: string; color?: string; size?: string; repeatLogo?: boolean }) =>
      requests.createArtwork(orderItemId, { orderItemId, ...data }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Artwork added" });
    },
    onError: () => toast({ title: "Failed to add artwork", variant: "destructive" }),
  });
}

export function useDeleteArtwork(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ orderItemId, artworkId }: { orderItemId: string | number; artworkId: string | number }) =>
      requests.deleteArtwork(orderItemId, artworkId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Artwork removed" });
    },
    onError: () => toast({ title: "Failed to remove artwork", variant: "destructive" }),
  });
}

// Artwork Files
export function useAddArtworkFile(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ artworkId, file }: { artworkId: string | number; file: Record<string, any> }) =>
      requests.addArtworkFile(artworkId, file),
    onSuccess: () => {
      invalidate();
      toast({ title: "File added" });
    },
    onError: () => toast({ title: "Failed to add file", variant: "destructive" }),
  });
}

export function useRemoveArtworkFile(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ artworkId, fileId }: { artworkId: string | number; fileId: string | number }) =>
      requests.removeArtworkFile(artworkId, fileId),
    onSuccess: () => invalidate(),
    onError: () => toast({ title: "Failed to remove file", variant: "destructive" }),
  });
}

// Copy Artwork
export function useCopyArtwork(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ targetItemId, sourceArtworkId, includePricing }: { targetItemId: string | number; sourceArtworkId: string | number; includePricing?: boolean }) =>
      requests.copyArtwork(targetItemId, sourceArtworkId, includePricing),
    onSuccess: () => {
      invalidate();
      toast({ title: "Artwork copied" });
    },
    onError: () => toast({ title: "Failed to copy artwork", variant: "destructive" }),
  });
}

// Artwork Charges
export function useCreateArtworkCharge(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ artworkId, charge }: { artworkId: string | number; charge: Record<string, any> }) =>
      requests.createArtworkCharge(artworkId, charge),
    onSuccess: () => {
      invalidate();
      toast({ title: "Charge added" });
    },
    onError: () => toast({ title: "Failed to add charge", variant: "destructive" }),
  });
}

export function useUpdateArtworkCharge(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ artworkId, chargeId, updates }: { artworkId: string | number; chargeId: string | number; updates: Record<string, any> }) =>
      requests.updateArtworkCharge(artworkId, chargeId, updates),
    onSuccess: () => invalidate(),
    onError: () => toast({ title: "Failed to update charge", variant: "destructive" }),
  });
}

export function useDeleteArtworkCharge(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: ({ artworkId, chargeId }: { artworkId: string | number; chargeId: string | number }) =>
      requests.deleteArtworkCharge(artworkId, chargeId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Charge removed" });
    },
    onError: () => toast({ title: "Failed to remove charge", variant: "destructive" }),
  });
}

export function useApplyMatrixPricing(projectId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateProjectItems(projectId);
  return useMutation({
    mutationFn: async ({ artworkId, supplierId, quantity }: { artworkId: string; supplierId: string; quantity: number }) => {
      const { apiRequest } = await import("@/lib/queryClient");
      const res = await apiRequest("POST", "/api/matrices/apply", { artworkId, supplierId, quantity });
      return res.json();
    },
    onSuccess: (data) => {
      invalidate();
      if (data.applied) {
        toast({ title: `Matrix pricing applied`, description: `${data.charges.length} charge(s) from "${data.matrixName}"` });
      } else {
        toast({ title: "No matrix pricing found", description: data.message, variant: "destructive" });
      }
    },
    onError: () => toast({ title: "Failed to apply matrix pricing", variant: "destructive" }),
  });
}
