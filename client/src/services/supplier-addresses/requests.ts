import { apiRequest } from "@/lib/queryClient";
import type { CreateSupplierAddress, UpdateSupplierAddress } from "./types";

export async function fetchSupplierAddresses(supplierId: string) {
  const res = await apiRequest("GET", `/api/suppliers/${supplierId}/addresses`);
  return res.json();
}

export async function createSupplierAddress({
  supplierId,
  data,
}: {
  supplierId: string;
  data: CreateSupplierAddress;
}) {
  const response = await apiRequest("POST", `/api/suppliers/${supplierId}/addresses`, data);
  return response.json();
}

export async function updateSupplierAddress({
  supplierId,
  addressId,
  data,
}: {
  supplierId: string;
  addressId: string;
  data: UpdateSupplierAddress;
}) {
  const response = await apiRequest(
    "PATCH",
    `/api/suppliers/${supplierId}/addresses/${addressId}`,
    data
  );
  return response.json();
}

export async function deleteSupplierAddress({
  supplierId,
  addressId,
}: {
  supplierId: string;
  addressId: string;
}) {
  await apiRequest("DELETE", `/api/suppliers/${supplierId}/addresses/${addressId}`);
  return true;
}
