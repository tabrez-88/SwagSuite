import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ssActivewearKeys } from "./keys";
import * as requests from "./requests";
import type { SsActivewearProduct } from "./types";

export function useSsActivewearSearch() {
  return useMutation({ mutationFn: requests.searchSsActivewear });
}

export function useSsActivewearSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ products }: { products: SsActivewearProduct[]; productId?: string }) =>
      requests.syncSsActivewearProducts(products),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
  });
}

export function useSsActivewearTestConnection() {
  return useMutation({ mutationFn: requests.testSsActivewearConnection });
}

export function useSsActivewearImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.startSsActivewearImport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ssActivewearKeys.importJobs }),
  });
}
