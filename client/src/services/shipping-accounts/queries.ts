import { useQuery } from "@tanstack/react-query";
import { shippingAccountKeys } from "./keys";
import type { ShippingAccount } from "./types";

export function useShippingAccounts() {
  return useQuery<ShippingAccount[]>({
    queryKey: shippingAccountKeys.org,
  });
}

export function useCompanyShippingAccounts(companyId: string | undefined) {
  return useQuery<ShippingAccount[]>({
    queryKey: shippingAccountKeys.company(companyId!),
    enabled: !!companyId,
  });
}
