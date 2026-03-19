import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { activityKeys } from "./keys";
import * as requests from "./requests";

export function usePostActivity(orderId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Record<string, any>) => requests.postActivity(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.byOrder(orderId) });
      toast({ title: "Note sent" });
    },
    onError: () => toast({ title: "Failed to post note", variant: "destructive" }),
  });
}
