import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shippingAccountKeys } from "./keys";
import type { ShippingAccount } from "./types";
import * as requests from "./requests";

function useInvalidateOrg() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: shippingAccountKeys.org });
}

function useInvalidateCompany(companyId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    if (companyId) {
      queryClient.invalidateQueries({ queryKey: shippingAccountKeys.company(companyId) });
    }
    queryClient.invalidateQueries({ queryKey: shippingAccountKeys.org });
  };
}

export function useCreateShippingAccount(companyId?: string) {
  const invalidate = companyId ? useInvalidateCompany(companyId) : useInvalidateOrg();
  return useMutation({ mutationFn: requests.createShippingAccount, onSuccess: invalidate });
}

export function useUpdateShippingAccount(companyId?: string) {
  const invalidate = companyId ? useInvalidateCompany(companyId) : useInvalidateOrg();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ShippingAccount> }) =>
      requests.updateShippingAccount(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteShippingAccount(companyId?: string) {
  const invalidate = companyId ? useInvalidateCompany(companyId) : useInvalidateOrg();
  return useMutation({ mutationFn: requests.deleteShippingAccount, onSuccess: invalidate });
}
