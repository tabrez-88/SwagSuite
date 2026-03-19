import { useQuery } from "@tanstack/react-query";
import { orderKeys } from "./keys";

export function useOrders<T = any[]>() {
  return useQuery<T>({ queryKey: orderKeys.all });
}

export function useOrder<T = any>(orderId: string | number) {
  return useQuery<T>({ queryKey: orderKeys.detail(orderId), enabled: !!orderId });
}
