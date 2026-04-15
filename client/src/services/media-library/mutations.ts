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
