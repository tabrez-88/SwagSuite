import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sequenceKeys } from "./keys";
import * as requests from "./requests";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: sequenceKeys.all });
    queryClient.invalidateQueries({ queryKey: sequenceKeys.enrollments });
  };
}

export function useCreateSequence() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.createSequence, onSuccess: invalidate });
}

export function useUpdateSequence() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => requests.updateSequence(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteSequence() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.deleteSequence, onSuccess: invalidate });
}
