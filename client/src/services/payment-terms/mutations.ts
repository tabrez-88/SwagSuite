import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentTermsKeys } from "./keys";
import type { PaymentTerm } from "./types";
import * as requests from "./requests";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: paymentTermsKeys.all });
}

export function useCreatePaymentTerm() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.createPaymentTerm, onSuccess: invalidate });
}

export function useUpdatePaymentTerm() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaymentTerm> }) =>
      requests.updatePaymentTerm(id, data),
    onSuccess: invalidate,
  });
}

export function useDeletePaymentTerm() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.deletePaymentTerm, onSuccess: invalidate });
}

export function useSetDefaultPaymentTerm() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: requests.setDefaultPaymentTerm,
    onSuccess: invalidate,
  });
}
