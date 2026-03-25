import { useQuery } from "@tanstack/react-query";
import { companyAddressKeys } from "./keys";
import * as requests from "./requests";
import type { CompanyAddress } from "./types";

export function useCompanyAddresses(companyId: string | undefined) {
  return useQuery<CompanyAddress[]>({
    queryKey: companyAddressKeys.byCompany(companyId!),
    queryFn: () => requests.fetchCompanyAddresses(companyId!),
    enabled: !!companyId,
  });
}
