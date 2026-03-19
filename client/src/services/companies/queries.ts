import { useQuery } from "@tanstack/react-query";
import { companyKeys } from "./keys";
import * as requests from "./requests";
import type { Company } from "./types";

export function useCompanies() {
  return useQuery<Company[]>({
    queryKey: companyKeys.all,
  });
}

export function useCompany(companyId: string | undefined) {
  return useQuery<Company>({
    queryKey: companyKeys.detail(companyId!),
    enabled: !!companyId,
  });
}

export function useCompanyContacts(companyId: string | undefined) {
  return useQuery<any[]>({
    queryKey: ["/api/contacts", { companyId }],
    queryFn: () => requests.fetchCompanyContacts(companyId!),
    enabled: !!companyId,
  });
}
