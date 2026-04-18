import { apiRequest } from "@/lib/queryClient";
import type { SageProduct } from "./types";

export async function testSageConnection(): Promise<{ message?: string; connected?: boolean }> {
  const res = await apiRequest("POST", "/api/integrations/sage/test");
  return res.json();
}

export async function searchSageProducts(query: string): Promise<SageProduct[]> {
  const res = await apiRequest("GET", `/api/sage/products?search=${encodeURIComponent(query)}&limit=50`);
  return res.json();
}

/** Search SAGE via integration endpoint — returns { products: [...] } wrapper */
export async function searchSageIntegration(query: string): Promise<{ products: any[] }> {
  const res = await apiRequest("GET", `/api/integrations/sage/products?${new URLSearchParams({ search: query })}`);
  return res.json();
}

export async function syncSageProducts(
  products: SageProduct[],
): Promise<{ message?: string }> {
  const res = await apiRequest("POST", "/api/integrations/sage/products/sync", { products });
  return res.json();
}
