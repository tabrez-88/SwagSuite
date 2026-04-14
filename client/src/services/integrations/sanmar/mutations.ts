import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as requests from "./requests";
import type { SanMarProduct } from "./types";

export function useSanmarSearch() {
  return useMutation({ mutationFn: requests.searchSanmar });
}

export function useSanmarSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ products }: { products: SanMarProduct[]; productId?: string }) =>
      requests.syncSanmarProducts(products).then((data) => ({ data, count: data.count ?? products.length })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
  });
}
