import { apiRequest } from "@/lib/queryClient";
import type { ProductionStage, NextActionType, StageInput, StageUpdate } from "./types";

async function json<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

// ---- Production stages ----
export async function fetchStages(): Promise<ProductionStage[]> {
  return json(await apiRequest("GET", "/api/production/stages"));
}

export async function fetchActionTypes(): Promise<NextActionType[]> {
  return json(await apiRequest("GET", "/api/production/next-action-types"));
}

export async function createStage(input: StageInput): Promise<ProductionStage> {
  return json(await apiRequest("POST", "/api/production/stages", input));
}

export async function updateStage({ id, ...data }: StageUpdate): Promise<ProductionStage> {
  return json(await apiRequest("PUT", `/api/production/stages/${id}`, data));
}

export async function deleteStage(id: string): Promise<{ success: boolean }> {
  return json(await apiRequest("DELETE", `/api/production/stages/${id}`));
}

export async function reorderStages(stageIds: string[]): Promise<ProductionStage[]> {
  return json(await apiRequest("POST", "/api/production/stages/reorder", { stageIds }));
}

export async function resetStages(): Promise<ProductionStage[]> {
  return json(await apiRequest("POST", "/api/production/stages/reset"));
}

// ---- Next action types ----
export async function createActionType(input: StageInput): Promise<NextActionType> {
  return json(await apiRequest("POST", "/api/production/next-action-types", input));
}

export async function updateActionType({ id, ...data }: StageUpdate): Promise<NextActionType> {
  return json(await apiRequest("PUT", `/api/production/next-action-types/${id}`, data));
}

export async function deleteActionType(id: string): Promise<{ success: boolean }> {
  return json(await apiRequest("DELETE", `/api/production/next-action-types/${id}`));
}

export async function reorderActionTypes(typeIds: string[]): Promise<NextActionType[]> {
  return json(await apiRequest("POST", "/api/production/next-action-types/reorder", { typeIds }));
}

export async function resetActionTypes(): Promise<NextActionType[]> {
  return json(await apiRequest("POST", "/api/production/next-action-types/reset"));
}

export async function fetchPoReport(queryParams: string) {
  const res = await apiRequest("GET", `/api/production/po-report?${queryParams}`);
  return res.json();
}
