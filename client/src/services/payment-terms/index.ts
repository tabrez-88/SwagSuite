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

export async function createPaymentTerm(data: Partial<PaymentTerm>): Promise<PaymentTerm> {
  const res = await apiRequest("POST", "/api/payment-terms", data);
  return res.json();
}

export async function updatePaymentTerm(
  id: string,
  data: Partial<PaymentTerm>,
): Promise<PaymentTerm> {
  const res = await apiRequest("PATCH", `/api/payment-terms/${id}`, data);
  return res.json();
}

export async function deletePaymentTerm(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/payment-terms/${id}`);
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: paymentTermsKeys.all });
}

export function useCreatePaymentTerm() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: createPaymentTerm, onSuccess: invalidate });
}

export function useUpdatePaymentTerm() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaymentTerm> }) =>
      updatePaymentTerm(id, data),
    onSuccess: invalidate,
  });
}

export function useDeletePaymentTerm() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deletePaymentTerm, onSuccess: invalidate });
}

export function useSetDefaultPaymentTerm() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/payment-terms/${id}/set-default`);
      return res.json();
    },
    onSuccess: invalidate,
  });
}
