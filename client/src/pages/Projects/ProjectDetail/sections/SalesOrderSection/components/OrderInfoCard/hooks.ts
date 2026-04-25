import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCalculateTax } from "@/services/projects/mutations";
import { useTaxCodes } from "@/services/tax-codes";

export function useOrderInfoCard({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const { data: taxCodes } = useTaxCodes();

  const _calculateTax = useCalculateTax(projectId);
  const calculateTaxMutation = useMemo(() => ({
    ..._calculateTax,
    mutate: () =>
      _calculateTax.mutate(undefined, {
        onSuccess: () =>
          toast({ title: "Tax Calculated", description: "Tax has been updated based on TaxJar rates." }),
        onError: (error: Error) =>
          toast({ title: "Tax Calculation Failed", description: error.message, variant: "destructive" }),
      }),
  }), [_calculateTax, toast]);

  return { calculateTaxMutation, taxCodes };
}
