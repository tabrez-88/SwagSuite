import { usePaymentTerms } from "@/services/payment-terms";
import { useTaxCodes } from "@/services/tax-codes";

export function useQuoteEditDialog() {
  const { data: paymentTermsOptions = [] } = usePaymentTerms();
  const { data: taxCodes = [] } = useTaxCodes();

  return { paymentTermsOptions, taxCodes };
}
