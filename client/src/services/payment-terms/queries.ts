import { useQuery } from "@tanstack/react-query";
import { paymentTermsKeys } from "./keys";
import type { PaymentTerm } from "./types";

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
