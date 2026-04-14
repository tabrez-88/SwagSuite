import {
  useMediaLibraryQuery,
  useUploadMediaFiles,
  useDeleteMediaItem,
} from "@/services/media-library";
import type { MediaLibraryFilters } from "@/services/media-library";

/** @deprecated Import from `@/services/media-library` directly. */
export function useMediaLibrary(filters: MediaLibraryFilters = {}) {
  return useMediaLibraryQuery(filters);
}

/** @deprecated Import `useUploadMediaFiles` from `@/services/media-library`. */
export const useUploadToMediaLibrary = useUploadMediaFiles;

/** @deprecated Import `useDeleteMediaItem` from `@/services/media-library`. */
export const useDeleteMediaLibraryItem = useDeleteMediaItem;
