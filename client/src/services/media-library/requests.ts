import type { MediaLibraryFilters, MediaLibraryItem, MediaLibraryListResponse, UploadInput } from "./types";

/**
 * Media endpoints use plain fetch (not axios / apiRequest) because file
 * upload sends `FormData` and listing requires building query params. These
 * requests intentionally sit outside the JSON apiRequest path.
 */

export function buildQueryString(filters: Omit<MediaLibraryFilters, "enabled">): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export async function listMediaLibrary(queryString: string): Promise<MediaLibraryListResponse> {
  const url = queryString ? `/api/media-library?${queryString}` : "/api/media-library";
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch media library");
  return res.json();
}

export async function uploadMediaFiles(input: UploadInput): Promise<MediaLibraryItem[]> {
  const formData = new FormData();
  input.files.forEach((f) => formData.append("files", f));
  if (input.folder) formData.append("folder", input.folder);
  if (input.category) formData.append("category", input.category);
  if (input.orderId) formData.append("orderId", input.orderId);
  if (input.companyId) formData.append("companyId", input.companyId);

  const res = await fetch("/api/media-library/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch { /* not JSON */ }
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteMediaItem(id: string): Promise<void> {
  const res = await fetch(`/api/media-library/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
}
