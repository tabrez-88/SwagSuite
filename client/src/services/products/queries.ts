import { useQuery } from "@tanstack/react-query";
import type { Product, Order } from "@shared/schema";
import { productKeys } from "./keys";
import * as requests from "./requests";

export function useProducts<T = Product[]>() {
  return useQuery<T>({
    queryKey: productKeys.all,
  });
}

export function useProduct<T = Product>(id: string | number) {
  return useQuery<T>({
    queryKey: productKeys.detail(id),
    enabled: !!id,
  });
}

export function usePopularProducts<T = Product[]>() {
  return useQuery<T>({
    queryKey: productKeys.popular,
  });
}

export function useSuggestedProducts<T = Product[]>() {
  return useQuery<T>({
    queryKey: productKeys.suggested,
  });
}

export function useProductOrders<T = Order[]>(productId: string | number | undefined) {
  return useQuery<T>({
    queryKey: ["/api/products", productId, "orders"],
    enabled: !!productId,
    queryFn: () => requests.fetchProductOrders(productId!),
  });
}
