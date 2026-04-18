import { apiRequest } from "@/lib/queryClient";
import type { MediaLibraryFilters, MediaLibraryItem, MediaLibraryListResponse, UploadInput } from "./types";

/**
 * Media endpoints. File upload uses plain fetch because FormData cannot
 * go through the JSON apiRequest path.
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
  const res = await apiRequest("GET", url);
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
  await apiRequest("DELETE", `/api/media-library/${id}`);
}

export async function renameMediaItem(input: { id: string; fileName: string }): Promise<MediaLibraryItem> {
  const res = await apiRequest("PATCH", `/api/media-library/${input.id}`, { fileName: input.fileName });
  return res.json();
}

/** Upload single file to Cloudinary (FormData — must use raw fetch) */
export async function uploadToCloudinary(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/cloudinary/upload", {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(err.message || "Failed to upload image");
  }
  return res.json();
}

/** Fetch a file URL as a Blob (for PDF preview, file download, etc.) */
export async function fetchFileBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { credentials: "include" });
  return res.blob();
}

/** Download a file by fetching as blob and triggering browser download */
export async function downloadFile(url: string, fileName: string): Promise<void> {
  const blob = await fetchFileBlob(url);
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
