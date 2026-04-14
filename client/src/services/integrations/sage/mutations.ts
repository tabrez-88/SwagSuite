import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sageKeys } from "./keys";
import * as requests from "./requests";
import type { SageProduct } from "./types";

export function useSageTestConnection() {
  return useMutation({ mutationFn: requests.testSageConnection });
}

export function useSageSearch() {
  return useMutation({ mutationFn: requests.searchSageProducts });
}

export function useSageSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ products }: { products: SageProduct[]; productId?: string }) =>
      requests.syncSageProducts(products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sageKeys.products });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
  });
}
