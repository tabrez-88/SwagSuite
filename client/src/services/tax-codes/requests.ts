import { apiRequest } from "@/lib/queryClient";
import type { TaxCode } from "./types";

export async function createTaxCode(data: Partial<TaxCode>): Promise<TaxCode> {
  const res = await apiRequest("POST", "/api/tax-codes", data);
  return res.json();
}

export async function updateTaxCode(id: string, data: Partial<TaxCode>): Promise<TaxCode> {
  const res = await apiRequest("PATCH", `/api/tax-codes/${id}`, data);
  return res.json();
}

export async function deleteTaxCode(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/tax-codes/${id}`);
}
