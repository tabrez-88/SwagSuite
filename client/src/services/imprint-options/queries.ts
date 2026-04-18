import { useQuery } from "@tanstack/react-query";
import { imprintOptionKeys } from "./keys";
import * as requests from "./requests";
import type { ImprintOption, ImprintOptionSuggestion, ImprintOptionType } from "./types";

export function useImprintOptions(type: ImprintOptionType, includeInactive = false) {
  return useQuery<ImprintOption[]>({
    queryKey: imprintOptionKeys.byType(type, includeInactive),
    queryFn: () => requests.fetchImprintOptions(type, includeInactive),
  });
}

export function useImprintSuggestions(status?: string) {
  return useQuery<ImprintOptionSuggestion[]>({
    queryKey: imprintOptionKeys.suggestions(status),
    queryFn: () => requests.fetchImprintSuggestions(status),
  });
}

export function useImprintSuggestionPendingCount() {
  return useQuery<{ count: number }>({
    queryKey: imprintOptionKeys.pendingCount,
    queryFn: requests.fetchImprintSuggestionPendingCount,
  });
}
