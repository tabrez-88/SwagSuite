import { useTaxCodes } from "@/services/tax-codes";

export function useFinancialSummaryCard() {
  const { data: taxCodes } = useTaxCodes();
  return { taxCodes };
}
