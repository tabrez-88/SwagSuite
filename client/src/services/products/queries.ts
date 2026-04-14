import { useQuery } from "@tanstack/react-query";
import { productKeys } from "./keys";

export function useProducts<T = any[]>() {
  return useQuery<T>({
    queryKey: productKeys.all,
  });
}

export function useProduct<T = any>(id: string | number) {
  return useQuery<T>({
    queryKey: productKeys.detail(id),
    enabled: !!id,
  });
}

export function usePopularProducts<T = any>() {
  return useQuery<T>({
    queryKey: productKeys.popular,
  });
}

export function useSuggestedProducts<T = any>() {
  return useQuery<T>({
    queryKey: productKeys.suggested,
  });
}

export function useProductOrders<T = any[]>(productId: string | number | undefined) {
  return useQuery<T>({
    queryKey: ["/api/products", productId, "orders"],
    enabled: !!productId,
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/orders`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch product orders");
      return res.json();
    },
  });
}
