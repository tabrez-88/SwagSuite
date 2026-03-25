import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { companyAddressKeys } from "./keys";
import * as requests from "./requests";

export function useCreateCompanyAddress(companyId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof requests.createCompanyAddress>[0]["data"]) =>
      requests.createCompanyAddress({ companyId, data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyAddressKeys.byCompany(companyId) });
      toast({ title: "Address added", description: "The address has been saved." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add address.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCompanyAddress(companyId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ addressId, data }: { addressId: string; data: Parameters<typeof requests.updateCompanyAddress>[0]["data"] }) =>
      requests.updateCompanyAddress({ companyId, addressId, data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyAddressKeys.byCompany(companyId) });
      toast({ title: "Address updated", description: "The address has been updated." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update address.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCompanyAddress(companyId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (addressId: string) =>
      requests.deleteCompanyAddress({ companyId, addressId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyAddressKeys.byCompany(companyId) });
      toast({ title: "Address deleted", description: "The address has been removed." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address.",
        variant: "destructive",
      });
    },
  });
}
