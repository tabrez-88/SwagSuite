/**
 * Decorator matrix service — centralized endpoints for `/api/matrices/*` and
 * `/api/suppliers/:id/matrices`, used by DecoratorMatrixTab.
 *
 * NOTE: `pages/Settings/DecoratorMatrixTab.tsx` still contains inline
 * `useMutation` calls because each of its nested editors (groups / rows /
 * charges) has bespoke optimistic-update logic. Migrate those gradually to
 * consume these request functions; keep the tab's react-query code-path
 * unchanged until each surface is converted.
 */
import { apiRequest } from "@/lib/queryClient";

export async function fetchMatrix(id: string): Promise<any> {
  const res = await apiRequest("GET", `/api/matrices/${id}`);
  return res.json();
}

export async function fetchMatricesBySupplier(supplierId: string): Promise<any[]> {
  const res = await apiRequest("GET", `/api/suppliers/${supplierId}/matrices`);
  return res.json();
}

export async function createMatrix(data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/matrices", data);
  return res.json();
}

export async function updateMatrix(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("PATCH", `/api/matrices/${id}`, data);
  return res.json();
}

export async function deleteMatrix(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/matrices/${id}`);
}

export async function copyMatrix(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", `/api/matrices/${id}/copy`, data);
  return res.json();
}
