import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { orderKeys } from "@/services/orders/keys";
import * as requests from "./requests";

function useInvalidateOrderItems(orderId: string | number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orderKeys.items(orderId) });
    queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
    queryClient.invalidateQueries({ queryKey: orderKeys.itemLines(orderId) });
    queryClient.invalidateQueries({ queryKey: orderKeys.itemCharges(orderId) });
    queryClient.invalidateQueries({ queryKey: orderKeys.artworks(orderId) });
  };
}

export function useDeleteOrderItem(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateOrderItems(orderId);
  return useMutation({
    mutationFn: (orderItemId: string | number) =>
      requests.deleteOrderItem(orderId, orderItemId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Item removed", description: "Product has been removed from this order." });
    },
    onError: () => toast({ title: "Failed to remove item", variant: "destructive" }),
  });
}

export function useUpdateOrderItem(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateOrderItems(orderId);
  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string | number; updates: Record<string, any> }) =>
      requests.updateOrderItem(orderId, itemId, updates),
    onSuccess: () => {
      invalidate();
      toast({ title: "Item updated", description: "Product details have been saved." });
    },
    onError: () => toast({ title: "Failed to update item", variant: "destructive" }),
  });
}

export function useAddLine(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateOrderItems(orderId);
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

export function useUpdateLine(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateOrderItems(orderId);
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

export function useDeleteLine(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateOrderItems(orderId);
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

export function useAddCharge(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateOrderItems(orderId);
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

export function useDeleteCharge(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateOrderItems(orderId);
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

export function useToggleChargeDisplay(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateOrderItems(orderId);
  return useMutation({
    mutationFn: ({ orderItemId, chargeId, displayToClient }: { orderItemId: string | number; chargeId: string | number; displayToClient: boolean }) =>
      requests.updateCharge(orderItemId, chargeId, { displayToClient }),
    onSuccess: () => invalidate(),
    onError: () => toast({ title: "Failed to update charge", variant: "destructive" }),
  });
}

export function useCreateArtwork(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateOrderItems(orderId);
  return useMutation({
    mutationFn: ({ orderItemId, ...data }: { orderItemId: string | number; name: string; filePath: string; fileName: string; location?: string; artworkType?: string; color?: string; size?: string }) =>
      requests.createArtwork(orderItemId, { orderItemId, ...data }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Artwork added" });
    },
    onError: () => toast({ title: "Failed to add artwork", variant: "destructive" }),
  });
}

export function useDeleteArtwork(orderId: string | number) {
  const { toast } = useToast();
  const invalidate = useInvalidateOrderItems(orderId);
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
