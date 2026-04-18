import { useMutation, useQueryClient } from "@tanstack/react-query";
import { newsletterKeys } from "./keys";
import * as requests from "./requests";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: newsletterKeys.all });
}

export function useCreateNewsletter() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.createNewsletter, onSuccess: invalidate });
}
