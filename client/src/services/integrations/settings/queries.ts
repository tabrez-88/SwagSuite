import { useQuery } from "@tanstack/react-query";
import { integrationSettingsKeys } from "./keys";
import * as requests from "./requests";

export function useIntegrationSettingsList<T = any>() {
  return useQuery<T>({
    queryKey: integrationSettingsKeys.list,
    queryFn: requests.fetchIntegrationSettings,
    staleTime: 1000 * 60 * 5,
  });
}

export function useIntegrationConfigurations<T = any[]>() {
  return useQuery<T>({
    queryKey: integrationSettingsKeys.configurations,
    queryFn: () => requests.fetchIntegrationConfigurations() as Promise<T>,
  });
}

export function useIntegrationCredentials<T = any[]>() {
  return useQuery<T>({
    queryKey: integrationSettingsKeys.credentials,
    queryFn: () => requests.fetchIntegrationCredentials() as Promise<T>,
    retry: false,
  });
}
