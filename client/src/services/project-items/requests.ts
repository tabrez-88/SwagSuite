import { apiRequest } from "@/lib/queryClient";

// Project items
export async function deleteProjectItem(projectId: string | number, itemId: string | number) {
  await apiRequest("DELETE", `/api/projects/${projectId}/items/${itemId}`);
}

export async function updateProjectItem(projectId: string | number, itemId: string | number, updates: Record<string, any>) {
  await apiRequest("PATCH", `/api/projects/${projectId}/items/${itemId}`, updates);
}

export async function duplicateProjectItem(projectId: string | number, itemId: string | number) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/items/${itemId}/duplicate`);
  return res.json();
}

export async function reorderProjectItems(projectId: string | number, itemIds: string[]) {
  await apiRequest("PATCH", `/api/projects/${projectId}/items/reorder`, { itemIds });
}

export async function reorderLines(itemId: string | number, lineIds: string[]) {
  await apiRequest("PATCH", `/api/project-items/${itemId}/lines/reorder`, { lineIds });
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

// Artwork Files (multiple per artwork)
export async function addArtworkFile(artworkId: string | number, data: Record<string, any>) {
  const res = await apiRequest("POST", `/api/artworks/${artworkId}/files`, data);
  return res.json();
}

export async function removeArtworkFile(artworkId: string | number, fileId: string | number) {
  await apiRequest("DELETE", `/api/artworks/${artworkId}/files/${fileId}`);
}

// Copy Artwork
export async function copyArtwork(targetItemId: string | number, sourceArtworkId: string | number, includePricing: boolean = false) {
  const res = await apiRequest("POST", `/api/project-items/${targetItemId}/artworks/copy-from/${sourceArtworkId}?includePricing=${includePricing}`);
  return res.json();
}

// Create project item (special handling for 403 vendor "Do Not Order" responses)
export async function createProjectItem(projectId: string | number, data: Record<string, any>) {
  const res = await fetch(`/api/projects/${projectId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 403 && err.doNotOrder) {
      const e = new Error(err.message || "Vendor is blocked") as any;
      e.doNotOrder = true;
      e.supplierId = err.supplierId;
      e.supplierName = err.supplierName;
      throw e;
    }
    throw new Error(err.message || "Failed to create order item");
  }
  return res.json();
}

// Artwork Charges
export async function createArtworkCharge(artworkId: string | number, data: Record<string, any>) {
  const res = await apiRequest("POST", `/api/artworks/${artworkId}/charges`, data);
  return res.json();
}

export async function updateArtworkCharge(artworkId: string | number, chargeId: string | number, updates: Record<string, any>) {
  const res = await apiRequest("PATCH", `/api/artworks/${artworkId}/charges/${chargeId}`, updates);
  return res.json();
}

export async function deleteArtworkCharge(artworkId: string | number, chargeId: string | number) {
  await apiRequest("DELETE", `/api/artworks/${artworkId}/charges/${chargeId}`);
}

export async function updateArtwork(itemId: string | number, artworkId: string | number, updates: Record<string, any>) {
  const res = await apiRequest("PUT", `/api/project-items/${itemId}/artworks/${artworkId}`, updates);
  return res.json();
}

export async function reorderCharges(itemId: string | number, chargeIds: string[]) {
  await apiRequest("PATCH", `/api/project-items/${itemId}/charges/reorder`, { chargeIds });
}

export async function reorderArtworkCharges(artworkId: string | number, chargeIds: string[]) {
  await apiRequest("PATCH", `/api/artworks/${artworkId}/charges/reorder`, { chargeIds });
}
