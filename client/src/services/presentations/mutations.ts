import { useMutation, useQueryClient } from "@tanstack/react-query";
import { presentationKeys } from "./keys";
import * as requests from "./requests";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: presentationKeys.all });
}

export function useCreatePresentation() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.createPresentation, onSuccess: invalidate });
}

export function useImportPresentationFromHubspot() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.importFromHubspot, onSuccess: invalidate });
}

export function useGeneratePresentationContent() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.generatePresentationContent, onSuccess: invalidate });
}

export function useDeletePresentation() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.deletePresentation, onSuccess: invalidate });
}
