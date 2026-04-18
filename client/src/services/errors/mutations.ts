import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorTrackingKeys } from "./keys";
import * as requests from "./requests";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: errorTrackingKeys.all });
}

export function useCreateError() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.createError, onSuccess: invalidate });
}

export function useUpdateError() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => requests.updateError(id, data),
    onSuccess: invalidate,
  });
}

export function useResolveError() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.resolveError, onSuccess: invalidate });
}
