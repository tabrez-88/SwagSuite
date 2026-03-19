import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { orderKeys } from "@/services/orders/keys";
import { communicationKeys } from "./keys";
import * as requests from "./requests";

export function useSendCommunication(orderId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => requests.sendCommunication(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: communicationKeys.byOrder(orderId) });
    },
  });
}

export function useSendGenericEmail() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Record<string, any>) => requests.sendGenericEmail(data),
    onSuccess: () => toast({ title: "Email sent" }),
    onError: () => toast({ title: "Failed to send email", variant: "destructive" }),
  });
}
