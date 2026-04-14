import { useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationSettingsKeys } from "./keys";
import * as requests from "./requests";

export function useSaveIntegrationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.saveIntegrationSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: integrationSettingsKeys.list }),
  });
}

export function useStartQuickbooksAuth() {
  return useMutation({ mutationFn: requests.startQuickbooksAuth });
}

export function useUpdateIntegrationConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      requests.updateIntegrationConfig(id, updates),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: integrationSettingsKeys.configurations }),
  });
}

export function useSaveIntegrationCredentials() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.saveIntegrationCredentials,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationSettingsKeys.credentials });
      queryClient.invalidateQueries({ queryKey: integrationSettingsKeys.configurations });
    },
  });
}

export function useTestIntegrationConnection() {
  return useMutation({ mutationFn: requests.testIntegrationConnection });
}
