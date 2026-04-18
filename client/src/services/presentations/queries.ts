import { useQuery } from "@tanstack/react-query";
import { presentationKeys } from "./keys";
import * as requests from "./requests";
import type { Presentation } from "./types";

export function usePresentations() {
  return useQuery<Presentation[]>({
    queryKey: presentationKeys.all,
    queryFn: requests.fetchPresentations,
  });
}
