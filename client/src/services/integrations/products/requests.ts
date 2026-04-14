import { apiRequest } from "@/lib/queryClient";

export async function triggerIntegrationSync(input: {
  source: string;
  syncType: string;
}): Promise<{ message?: string }> {
  const res = await apiRequest("POST", `/api/integrations/${input.source}/sync`, {
    syncType: input.syncType,
  });
  return res.json();
}
