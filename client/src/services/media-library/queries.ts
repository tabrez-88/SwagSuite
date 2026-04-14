import { useQuery } from "@tanstack/react-query";
import { mediaLibraryKeys } from "./keys";
import { buildQueryString, listMediaLibrary } from "./requests";
import type { MediaLibraryFilters, MediaLibraryListResponse } from "./types";

export function useMediaLibraryQuery(filters: MediaLibraryFilters = {}) {
  const { enabled = true, ...rest } = filters;
  const queryString = buildQueryString(rest);
  return useQuery<MediaLibraryListResponse>({
    queryKey: mediaLibraryKeys.list(queryString),
    queryFn: () => listMediaLibrary(queryString),
    enabled,
  });
}
