import { useQuery } from "@tanstack/react-query";
import { supplierKeys } from "./keys";
import { fetchVendorProducts, fetchVendorContacts } from "./requests";
import type { Vendor, VendorContact } from "./types";

export function useSuppliers() {
  return useQuery<Vendor[]>({
    queryKey: supplierKeys.all,
  });
}

export function useSupplier(supplierId: string | number | undefined) {
  return useQuery<Vendor>({
    queryKey: supplierKeys.detail(supplierId ?? ""),
    enabled: !!supplierId,
  });
}

export function useVendorProducts(
  vendorId: string | undefined,
  enabled: boolean = false,
) {
  return useQuery({
    queryKey: supplierKeys.products(vendorId!),
    enabled: !!vendorId && enabled,
    queryFn: () => fetchVendorProducts(vendorId!),
  });
}

export function useVendorContacts(
  vendorId: string | undefined,
  enabled: boolean = false,
) {
  return useQuery<VendorContact[]>({
    queryKey: supplierKeys.contacts(vendorId!),
    enabled: !!vendorId && enabled,
    queryFn: () => fetchVendorContacts(vendorId!),
  });
}
