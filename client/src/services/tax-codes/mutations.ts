import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taxCodeKeys } from "./keys";
import * as requests from "./requests";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: taxCodeKeys.all });
}

export function useCreateTaxCode() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.createTaxCode, onSuccess: invalidate });
}

export function useUpdateTaxCode() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof requests.updateTaxCode>[1] }) =>
      requests.updateTaxCode(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteTaxCode() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.deleteTaxCode, onSuccess: invalidate });
}
