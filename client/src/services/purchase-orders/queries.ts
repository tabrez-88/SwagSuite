import { useQuery } from "@tanstack/react-query";
import { purchaseOrderKeys } from "./keys";
import { fetchPurchaseOrders } from "./requests";
import type { PurchaseOrderEntity } from "./types";

export function usePurchaseOrders(orderId: string | undefined) {
  return useQuery<PurchaseOrderEntity[]>({
    queryKey: purchaseOrderKeys.byOrder(orderId || ""),
    queryFn: () => fetchPurchaseOrders(orderId!),
    enabled: !!orderId,
    staleTime: Infinity,
  });
}
