import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mediaLibraryKeys } from "./keys";
import * as requests from "./requests";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.all });
}

export function useUploadMediaFiles() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.uploadMediaFiles, onSuccess: invalidate });
}

export function useDeleteMediaItem() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.deleteMediaItem, onSuccess: invalidate });
}

export function useRenameMediaItem() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.renameMediaItem, onSuccess: invalidate });
}

export function useBulkDeleteMediaItems() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => requests.deleteMediaItem(id)));
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) throw new Error(`${failed} file(s) failed to delete`);
    },
    onSuccess: invalidate,
  });
}
