import { useQuery } from "@tanstack/react-query";
import { ssActivewearKeys } from "./keys";
import type { SsBrand } from "./types";

export function useSsActivewearBrands() {
  return useQuery<SsBrand[]>({
    queryKey: ssActivewearKeys.brands,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });
}
