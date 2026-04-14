import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hubspotKeys } from "./keys";
import * as requests from "./requests";

export function useHubspotSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.triggerHubspotSync,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hubspotKeys.status }),
  });
}

export function useHubspotConfig() {
  return useMutation({ mutationFn: requests.updateHubspotConfig });
}
