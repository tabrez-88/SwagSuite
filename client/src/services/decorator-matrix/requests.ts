import { apiRequest } from "@/lib/queryClient";

// ── Matrix CRUD ──

export async function fetchMatrix(id: string) {
  const res = await apiRequest("GET", `/api/matrices/${id}`);
  return res.json();
}

export async function fetchMatricesBySupplier(supplierId: string) {
  const res = await apiRequest("GET", `/api/suppliers/${supplierId}/matrices`);
  return res.json();
}

export async function createSupplierMatrix(supplierId: string, data: Record<string, unknown>) {
  const res = await apiRequest("POST", `/api/suppliers/${supplierId}/matrices`, data);
  return res.json();
}

export async function updateMatrix(id: string, data: Record<string, unknown>) {
  const res = await apiRequest("PATCH", `/api/matrices/${id}`, data);
  return res.json();
}

export async function deleteMatrix(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/matrices/${id}`);
}

export async function copyMatrix(id: string) {
  const res = await apiRequest("POST", `/api/matrices/${id}/copy`);
  return res.json();
}

// ── Breakdowns ──

export async function addBreakdown(matrixId: string, data: Record<string, unknown> = {}) {
  const res = await apiRequest("POST", `/api/matrices/${matrixId}/breakdowns`, data);
  return res.json();
}

export async function updateBreakdown(matrixId: string, breakdownId: string, data: Record<string, unknown>) {
  const res = await apiRequest("PATCH", `/api/matrices/${matrixId}/breakdowns/${breakdownId}`, data);
  return res.json();
}

export async function removeBreakdown(matrixId: string, breakdownId: string): Promise<void> {
  await apiRequest("DELETE", `/api/matrices/${matrixId}/breakdowns/${breakdownId}`);
}

// ── Rows ──

export async function addRow(matrixId: string, data: Record<string, unknown> = {}) {
  const res = await apiRequest("POST", `/api/matrices/${matrixId}/rows`, data);
  return res.json();
}

export async function updateRow(matrixId: string, rowId: string, data: Record<string, unknown>) {
  const res = await apiRequest("PATCH", `/api/matrices/${matrixId}/rows/${rowId}`, data);
  return res.json();
}

export async function removeRow(matrixId: string, rowId: string): Promise<void> {
  await apiRequest("DELETE", `/api/matrices/${matrixId}/rows/${rowId}`);
}

// ── Cells ──

export async function updateCell(matrixId: string, cellId: string, price: string) {
  const res = await apiRequest("PATCH", `/api/matrices/${matrixId}/cells/${cellId}`, { price });
  return res.json();
}

// ── Grid batch save ──

export async function saveGrid(matrixId: string, cells: Array<{ rowId: string; breakdownId: string; price: string }>) {
  const res = await apiRequest("PUT", `/api/matrices/${matrixId}/grid`, { cells });
  return res.json();
}

// ── Lookup (for order-side picker) ──

export async function lookupMatrices(supplierId: string) {
  const params = new URLSearchParams({ supplierId });
  const res = await apiRequest("GET", `/api/matrices/lookup?${params}`);
  return res.json();
}
