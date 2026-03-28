import { apiRequest } from "@/lib/queryClient";

// Project items
export async function deleteProjectItem(projectId: string | number, itemId: string | number) {
  await apiRequest("DELETE", `/api/projects/${projectId}/items/${itemId}`);
}

export async function updateProjectItem(projectId: string | number, itemId: string | number, updates: Record<string, any>) {
  await apiRequest("PATCH", `/api/projects/${projectId}/items/${itemId}`, updates);
}

// Line items
export async function addLine(itemId: string | number, line: Record<string, any>) {
  await apiRequest("POST", `/api/project-items/${itemId}/lines`, { ...line, orderItemId: itemId });
}

export async function updateLine(itemId: string | number, lineId: string | number, updates: Record<string, any>) {
  await apiRequest("PATCH", `/api/project-items/${itemId}/lines/${lineId}`, updates);
}

export async function deleteLine(itemId: string | number, lineId: string | number) {
  await apiRequest("DELETE", `/api/project-items/${itemId}/lines/${lineId}`);
}

// Charges
export async function addCharge(itemId: string | number, charge: Record<string, any>) {
  await apiRequest("POST", `/api/project-items/${itemId}/charges`, { ...charge, orderItemId: itemId });
}

export async function updateCharge(itemId: string | number, chargeId: string | number, updates: Record<string, any>) {
  await apiRequest("PATCH", `/api/project-items/${itemId}/charges/${chargeId}`, updates);
}

export async function deleteCharge(itemId: string | number, chargeId: string | number) {
  await apiRequest("DELETE", `/api/project-items/${itemId}/charges/${chargeId}`);
}

// Artworks
export async function createArtwork(itemId: string | number, data: Record<string, any>) {
  const res = await apiRequest("POST", `/api/project-items/${itemId}/artworks`, data);
  return res.json();
}

export async function deleteArtwork(itemId: string | number, artworkId: string | number) {
  await apiRequest("DELETE", `/api/project-items/${itemId}/artworks/${artworkId}`);
}
