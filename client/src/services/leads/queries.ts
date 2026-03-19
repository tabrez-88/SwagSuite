import { useQuery } from "@tanstack/react-query";
import { leadKeys } from "./keys";
import type { Lead } from "./types";

export function useLeads() {
  return useQuery<Lead[]>({
    queryKey: leadKeys.all,
  });
}
