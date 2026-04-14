import { apiRequest } from "@/lib/queryClient";

export async function syncYtdSpending(): Promise<{ updated: number; [key: string]: unknown }> {
  const res = await apiRequest("POST", "/api/sync/ytd-spending");
  return res.json();
}
