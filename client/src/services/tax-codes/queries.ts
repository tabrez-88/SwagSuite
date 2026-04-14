import { useQuery } from "@tanstack/react-query";
import { taxCodeKeys } from "./keys";
import type { TaxCode } from "./types";

export function useTaxCodes() {
  return useQuery<TaxCode[]>({
    queryKey: taxCodeKeys.all,
    staleTime: 5 * 60 * 1000,
  });
}
