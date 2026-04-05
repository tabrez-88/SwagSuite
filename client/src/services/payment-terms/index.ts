import { useQuery } from "@tanstack/react-query";

export interface PaymentTerm {
  id: string;
  name: string;
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
