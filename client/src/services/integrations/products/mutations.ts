import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productIntegrationKeys } from "./keys";
import * as requests from "./requests";

export function useIntegrationSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.triggerIntegrationSync,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: productIntegrationKeys.configurations }),
  });
}
