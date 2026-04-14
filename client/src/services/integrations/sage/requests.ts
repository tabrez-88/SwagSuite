import { apiRequest } from "@/lib/queryClient";
import type { SageProduct } from "./types";

export async function testSageConnection(): Promise<{ message?: string; connected?: boolean }> {
  const res = await apiRequest("POST", "/api/integrations/sage/test");
  return res.json();
}

export async function searchSageProducts(query: string): Promise<SageProduct[]> {
  // Direct fetch — this endpoint returns a large array and bypasses the
  // apiRequest JSON envelope for search results.
  const res = await fetch(
    `/api/sage/products?search=${encodeURIComponent(query)}&limit=50`,
    { credentials: "include" },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(err.message || "Failed to search SAGE products");
  }
  return res.json();
}

export async function syncSageProducts(
  products: SageProduct[],
): Promise<{ message?: string }> {
  const res = await apiRequest("POST", "/api/integrations/sage/products/sync", { products });
  return res.json();
}
