import { useMutation, useQueryClient } from "@tanstack/react-query";
import { emailTemplateKeys } from "./keys";
import * as requests from "./requests";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
}

export function useCreateEmailTemplate() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.createTemplate, onSuccess: invalidate });
}

export function useUpdateEmailTemplate() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.updateTemplate, onSuccess: invalidate });
}

export function useDeleteEmailTemplate() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.deleteTemplate, onSuccess: invalidate });
}

export function useSetDefaultEmailTemplate() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.setDefaultTemplate, onSuccess: invalidate });
}
