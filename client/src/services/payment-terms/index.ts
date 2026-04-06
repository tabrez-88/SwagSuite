import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface PaymentTerm {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const paymentTermsKeys = {
  all: ["/api/payment-terms"] as const,
};

export function usePaymentTerms() {
  return useQuery<PaymentTerm[]>({
    queryKey: paymentTermsKeys.all,
  });
}

/** Returns the name of the default payment term, or undefined if none set */
export function useDefaultPaymentTermName() {
  const { data: terms } = usePaymentTerms();
  return terms?.find((t) => t.isDefault)?.name;
}

export function useSetDefaultPaymentTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/payment-terms/${id}/set-default`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentTermsKeys.all });
    },
  });
}
