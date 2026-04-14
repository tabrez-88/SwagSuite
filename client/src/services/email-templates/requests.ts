import { apiRequest } from "@/lib/queryClient";
import type { EmailTemplate } from "./types";

export async function listTemplates(type?: string): Promise<EmailTemplate[]> {
  const url = type
    ? `/api/settings/email-templates?type=${encodeURIComponent(type)}`
    : "/api/settings/email-templates";
  const res = await apiRequest("GET", url);
  return res.json();
}

export async function createTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
  const res = await apiRequest("POST", "/api/settings/email-templates", data);
  return res.json();
}

export async function updateTemplate({
  id,
  ...data
}: Partial<EmailTemplate> & { id: string }): Promise<EmailTemplate> {
  const res = await apiRequest("PATCH", `/api/settings/email-templates/${id}`, data);
  return res.json();
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/settings/email-templates/${id}`);
}

export async function setDefaultTemplate(id: string): Promise<EmailTemplate> {
  const res = await apiRequest("PATCH", `/api/settings/email-templates/${id}/default`);
  return res.json();
}
