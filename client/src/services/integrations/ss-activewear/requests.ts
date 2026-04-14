import { apiRequest } from "@/lib/queryClient";
import type { SsActivewearProduct, SsCredentials, SsImportInput } from "./types";

export async function searchSsActivewear(q: string): Promise<SsActivewearProduct[]> {
  const res = await apiRequest("GET", `/api/ss-activewear/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

export async function syncSsActivewearProducts(
  products: SsActivewearProduct[],
): Promise<{ count?: number }> {
  const res = await apiRequest("POST", "/api/ss-activewear/products/sync", { products });
  return res.json();
}

export async function testSsActivewearConnection(
  credentials: SsCredentials,
): Promise<{ connected: boolean }> {
  const res = await apiRequest("POST", "/api/ss-activewear/test-connection", credentials);
  return res.json();
}

export async function startSsActivewearImport(input: SsImportInput): Promise<void> {
  await apiRequest("POST", "/api/ss-activewear/import", input);
}
