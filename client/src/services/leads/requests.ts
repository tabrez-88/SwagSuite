import { apiRequest } from "@/lib/queryClient";
import type { LeadFormData } from "@/schemas/crm.schemas";

export async function createLead(data: LeadFormData) {
  return await apiRequest("POST", "/api/leads", data);
}

export async function deleteLead(leadId: string) {
  return await apiRequest("DELETE", `/api/leads/${leadId}`);
}
