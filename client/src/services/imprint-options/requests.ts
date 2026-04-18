import { apiRequest } from "@/lib/queryClient";
import type { ImprintOption, ImprintOptionSuggestion, ImprintOptionType } from "./types";

export async function fetchImprintOptions(type: ImprintOptionType, includeInactive = false): Promise<ImprintOption[]> {
  const qs = new URLSearchParams({ type });
  if (includeInactive) qs.set("includeInactive", "true");
  const res = await apiRequest("GET", `/api/imprint-options?${qs.toString()}`);
  return res.json();
}

export async function createImprintOption(data: {
  type: ImprintOptionType;
  label: string;
  value?: string;
  displayOrder?: number;
  isActive?: boolean;
}): Promise<ImprintOption> {
  const res = await apiRequest("POST", "/api/imprint-options", data);
  return res.json();
}

export async function updateImprintOption(id: string, data: Partial<Pick<ImprintOption, "label" | "displayOrder" | "isActive">>): Promise<ImprintOption> {
  const res = await apiRequest("PATCH", `/api/imprint-options/${id}`, data);
  return res.json();
}

export async function deleteImprintOption(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/imprint-options/${id}`);
}

export async function fetchImprintSuggestions(status?: string): Promise<ImprintOptionSuggestion[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await apiRequest("GET", `/api/imprint-option-suggestions${qs}`);
  return res.json();
}

export async function fetchImprintSuggestionPendingCount(): Promise<{ count: number }> {
  const res = await apiRequest("GET", "/api/imprint-option-suggestions/pending-count");
  return res.json();
}

export async function submitImprintSuggestion(data: {
  type: ImprintOptionType;
  label: string;
  suggestedFromOrderId?: string;
  note?: string;
}): Promise<{
  suggestion: ImprintOptionSuggestion | null;
  duplicate: boolean;
  reason?: "already_option" | "pending_duplicate";
  existingOption?: ImprintOption;
}> {
  const res = await apiRequest("POST", "/api/imprint-option-suggestions", data);
  return res.json();
}

export async function approveImprintSuggestion(id: string): Promise<any> {
  const res = await apiRequest("POST", `/api/imprint-option-suggestions/${id}/approve`);
  return res.json();
}

export async function rejectImprintSuggestion(id: string, note?: string): Promise<any> {
  const res = await apiRequest("POST", `/api/imprint-option-suggestions/${id}/reject`, { note });
  return res.json();
}
