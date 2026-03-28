import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "@/services/projects/keys";
import { communicationKeys } from "./keys";
import * as requests from "./requests";

export function useSendCommunication(projectId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => requests.sendCommunication(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: communicationKeys.byOrder(projectId) });
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
