import { apiRequest } from "@/lib/queryClient";
import type { CreateCompanyAddress, UpdateCompanyAddress } from "./types";

export async function fetchCompanyAddresses(companyId: string) {
  const res = await fetch(`/api/companies/${companyId}/addresses`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch company addresses");
  return res.json();
}

export async function createCompanyAddress({
  companyId,
  data,
}: {
  companyId: string;
  data: CreateCompanyAddress;
}) {
  const response = await apiRequest("POST", `/api/companies/${companyId}/addresses`, data);
  return response.json();
}

export async function updateCompanyAddress({
  companyId,
  addressId,
  data,
}: {
  companyId: string;
  addressId: string;
  data: UpdateCompanyAddress;
}) {
  const response = await apiRequest(
    "PATCH",
    `/api/companies/${companyId}/addresses/${addressId}`,
    data
  );
  return response.json();
}

export async function deleteCompanyAddress({
  companyId,
  addressId,
}: {
  companyId: string;
  addressId: string;
}) {
  await apiRequest("DELETE", `/api/companies/${companyId}/addresses/${addressId}`);
  return true;
}
