import { useMutation, useQueryClient } from "@tanstack/react-query";
import { newsMonitorKeys } from "./keys";
import * as requests from "./requests";

export function useUpdateNewsSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.updateNewsSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: newsMonitorKeys.settings }),
  });
}

function useInvalidateItems() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["/api/integrations/news/items"] });
}

export function useToggleNewsAlert() {
  const invalidate = useInvalidateItems();
  return useMutation({ mutationFn: requests.toggleNewsAlert, onSuccess: invalidate });
}

export function useSendNewsAlert() {
  const invalidate = useInvalidateItems();
  return useMutation({ mutationFn: requests.sendManualNewsAlert, onSuccess: invalidate });
}
