import { useQuery } from "@tanstack/react-query";
import { supplierAddressKeys } from "./keys";
import * as requests from "./requests";
import type { SupplierAddress } from "./types";

export function useSupplierAddresses(supplierId: string | undefined) {
  return useQuery<SupplierAddress[]>({
    queryKey: supplierAddressKeys.bySupplier(supplierId!),
    queryFn: () => requests.fetchSupplierAddresses(supplierId!),
    enabled: !!supplierId,
  });
}
