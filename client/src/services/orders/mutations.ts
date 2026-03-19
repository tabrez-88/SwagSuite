import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { orderKeys } from "./keys";
import * as requests from "./requests";

export function useUpdateOrder(orderId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Record<string, any>) => requests.updateOrder(orderId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) }),
  });
}

export function useDuplicateOrder(orderId: string | number) {
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => requests.duplicateOrder(orderId),
    onSuccess: (data: any) => {
      toast({ title: "Order duplicated!", description: `New order #${data.orderNumber || ""}` });
    },
    onError: () => toast({ title: "Failed to duplicate order", variant: "destructive" }),
  });
}

export function useRecalculateTotal(orderId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => requests.recalculateTotal(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      toast({ title: "Total recalculated" });
    },
    onError: () => toast({ title: "Failed to recalculate total", variant: "destructive" }),
  });
}
