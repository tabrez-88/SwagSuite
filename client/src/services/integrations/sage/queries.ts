import { useQuery } from "@tanstack/react-query";
import { sageKeys } from "./keys";
import type { SyncedSageProduct } from "./types";

export function useSageSyncedProducts() {
  return useQuery<SyncedSageProduct[]>({ queryKey: sageKeys.products });
}
