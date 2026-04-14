import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as requests from "./requests";

export function useSyncYtdSpending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.syncYtdSpending,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
  });
}
