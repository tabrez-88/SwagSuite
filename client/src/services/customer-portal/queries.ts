import { useQuery } from "@tanstack/react-query";
import { customerPortalKeys } from "./keys";
import * as requests from "./requests";

export function useCustomerPortalData<T = any>(token: string | undefined) {
  return useQuery<T>({
    queryKey: customerPortalKeys.data(token ?? ""),
    queryFn: () => requests.fetchCustomerPortalData<T>(token!),
    enabled: !!token,
  });
}
