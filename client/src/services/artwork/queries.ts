import { useQuery } from "@tanstack/react-query";
import { artworkKanbanKeys } from "./keys";
import * as requests from "./requests";

export function useArtworkColumns() {
  return useQuery<any[]>({ queryKey: artworkKanbanKeys.columns, queryFn: requests.fetchArtworkColumns });
}

export function useArtworkCards() {
  return useQuery<any[]>({ queryKey: artworkKanbanKeys.cards, queryFn: requests.fetchArtworkCards });
}
