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

export function useSendVendorEmail(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Record<string, any>) => requests.sendCommunication(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationKeys.byOrder(projectId, "vendor_email") });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast({ title: "Email sent", description: "Vendor email has been sent successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useSendClientEmail(projectId: string | number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Record<string, any>) => requests.sendCommunication(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationKeys.byOrder(projectId, "client_email") });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast({ title: "Email sent", description: "Client email has been sent successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
