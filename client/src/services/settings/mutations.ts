import { useMutation, useQueryClient } from "@tanstack/react-query";
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
