import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supplierAddressKeys } from "./keys";
import * as requests from "./requests";

export function useCreateSupplierAddress(supplierId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof requests.createSupplierAddress>[0]["data"]) =>
      requests.createSupplierAddress({ supplierId, data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierAddressKeys.bySupplier(supplierId) });
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

export function useUpdateSupplierAddress(supplierId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ addressId, data }: { addressId: string; data: Parameters<typeof requests.updateSupplierAddress>[0]["data"] }) =>
      requests.updateSupplierAddress({ supplierId, addressId, data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierAddressKeys.bySupplier(supplierId) });
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

export function useDeleteSupplierAddress(supplierId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (addressId: string) =>
      requests.deleteSupplierAddress({ supplierId, addressId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierAddressKeys.bySupplier(supplierId) });
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
