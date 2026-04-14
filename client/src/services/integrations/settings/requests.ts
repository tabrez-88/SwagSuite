import { apiRequest } from "@/lib/queryClient";

export async function fetchIntegrationSettings(): Promise<any> {
  const res = await apiRequest("GET", "/api/settings/integrations");
  return res.json();
}

export async function saveIntegrationSettings(data: any): Promise<any> {
  const res = await apiRequest("POST", "/api/settings/integrations", data);
  return res.json();
}

export async function startQuickbooksAuth(): Promise<{ url: string }> {
  const res = await fetch("/api/integrations/quickbooks/auth");
  if (!res.ok) throw new Error("Failed to start QuickBooks auth");
  return res.json();
}

export async function fetchIntegrationConfigurations(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/integrations/configurations");
  return res.json();
}

export async function fetchIntegrationCredentials(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/integrations/credentials");
  return res.json();
}

export async function updateIntegrationConfig(
  id: string,
  updates: Record<string, unknown>,
): Promise<any> {
  const res = await apiRequest("PATCH", `/api/integrations/configurations/${id}`, updates);
  return res.json();
}

export async function saveIntegrationCredentials(
  data: Record<string, string>,
): Promise<any> {
  const res = await apiRequest("POST", "/api/integrations/credentials", data);
  return res.json();
}

export async function testIntegrationConnection(
  integration: string,
): Promise<{ message?: string; connected?: boolean }> {
  const res = await apiRequest("POST", `/api/integrations/${integration}/test`);
  return res.json();
}
