import { apiRequest } from "@/lib/queryClient";

export async function fetchArtworkColumns(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/artwork/columns");
  return res.json();
}

export async function fetchArtworkCards(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/artwork/cards");
  return res.json();
}

export async function moveArtworkCard(cardId: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("PATCH", `/api/artwork/cards/${cardId}/move`, data);
  return res.json();
}

export async function createArtworkColumn(data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/artwork/columns", data);
  return res.json();
}

export async function initializeArtworkColumns(): Promise<any> {
  const res = await apiRequest("POST", "/api/artwork/columns/initialize", {});
  return res.json();
}

export async function updateArtworkCard(cardId: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("PATCH", `/api/artwork/cards/${cardId}`, data);
  return res.json();
}

export async function createArtworkCard(data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/artwork/cards", data);
  return res.json();
}
