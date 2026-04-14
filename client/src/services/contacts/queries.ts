import { useQuery } from "@tanstack/react-query";
import { contactKeys } from "./keys";
import * as requests from "./requests";
import type { Contact } from "./types";

export function useContacts() {
  return useQuery<Contact[]>({
    queryKey: contactKeys.all,
  });
}

export function useContact(id: string | undefined) {
  return useQuery<Contact>({
    queryKey: contactKeys.detail(id!),
    enabled: !!id,
  });
}

/** Alias kept for readability on detail pages. */
export const useContactDetail = useContact;

export function useContactsByCompany(companyId: string | undefined) {
  return useQuery<Contact[]>({
    queryKey: contactKeys.byCompany(companyId!),
    queryFn: () => requests.fetchContactsByCompany(companyId!),
    enabled: !!companyId,
  });
}
