import { useQuery } from "@tanstack/react-query";
import { matrixKeys } from "./keys";
import * as requests from "./requests";

export function useMatrix(id: string | undefined) {
  return useQuery<any>({
    queryKey: matrixKeys.detail(id ?? ""),
    queryFn: () => requests.fetchMatrix(id!),
    enabled: !!id,
  });
}

export function useMatricesBySupplier(supplierId: string | undefined) {
  return useQuery<any[]>({
    queryKey: matrixKeys.bySupplier(supplierId ?? ""),
    queryFn: () => requests.fetchMatricesBySupplier(supplierId!),
    enabled: !!supplierId,
  });
}
