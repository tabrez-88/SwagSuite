import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { settingsKeys } from "./keys";
import * as requests from "./requests";

export function useUpdateBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.updateBranding,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.branding }),
  });
}

export function useUpdateGeneralSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.updateGeneralSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.general }),
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.uploadLogo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.branding }),
  });
}

export function useUpdateIntegrationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.updateIntegrationSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.integration }),
  });
}

export function useSendTestEmail() {
  return useMutation({ mutationFn: requests.sendTestEmail });
}

export function useUpdateFeatureToggles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.updateFeatureToggles,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.admin }),
  });
}

export function useSaveNotificationPrefs() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: requests.updateNotificationPrefs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.notificationPrefs });
      toast({ title: "Saved", description: "Notification preferences updated." });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });
}

export function useSaveEmailCredentials() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: requests.saveUserEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.emailCredentials });
      toast({ title: "Saved", description: "Mail credentials saved successfully." });
    },
    onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to save mail credentials." }),
  });
}
