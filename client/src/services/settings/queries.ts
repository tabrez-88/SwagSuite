import { useQuery } from "@tanstack/react-query";
import { settingsKeys } from "./keys";
import type { BrandingSettings, GeneralSettings } from "./types";

export function useBranding() {
  return useQuery<BrandingSettings>({
    queryKey: settingsKeys.branding,
    staleTime: Infinity,
  });
}

export function useGeneralSettings() {
  return useQuery<GeneralSettings>({
    queryKey: settingsKeys.general,
  });
}

export function useAdminSettings<T = any>(enabled = true) {
  return useQuery<T>({ queryKey: settingsKeys.admin, enabled });
}

export function useIntegrationSettings<T = any>() {
  return useQuery<T>({ queryKey: settingsKeys.integration });
}
