import { apiRequest } from "@/lib/queryClient";
import type { SanMarProduct } from "./types";

export async function searchSanmar(q: string): Promise<SanMarProduct[]> {
  const res = await apiRequest("GET", `/api/sanmar/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

export async function syncSanmarProducts(
  products: SanMarProduct[],
): Promise<{ count?: number }> {
  const res = await apiRequest("POST", "/api/sanmar/products/sync", { products });
  return res.json();
}
