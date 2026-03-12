export interface MediaLibraryItem {
  id: string;
  cloudinaryPublicId: string | null;
  cloudinaryUrl: string;
  cloudinaryResourceType: string | null;
  fileName: string;
  originalName: string;
  fileSize: number | null;
  mimeType: string | null;
  fileExtension: string | null;
  thumbnailUrl: string | null;
  folder: string;
  tags: string[];
  category: string | null;
  orderId: string | null;
  companyId: string | null;
  orderItemId: string | null;
  sourceTable: string | null;
  sourceId: string | null;
  uploadedBy: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityAttachment {
  mediaLibraryId: string;
  fileName: string;
  mimeType: string;
  cloudinaryUrl: string;
  thumbnailUrl: string | null;
}

export function getCloudinaryThumbnail(url: string, width = 200, height = 200): string {
  if (!url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`);
}

export function isImageFile(mimeType: string | null, url?: string | null): boolean {
  if (mimeType?.startsWith("image/")) return true;
  // Fallback: detect from URL or file extension when mimeType is missing
  if (!mimeType && url) {
    const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
    return /\.(jpe?g|png|gif|webp|svg|bmp|ico|tiff?)$/.test(cleanUrl) ||
      cleanUrl.includes("/image/upload/"); // Cloudinary image URLs
  }
  return false;
}

export function isPdfFile(mimeType: string | null): boolean {
  return mimeType === "application/pdf";
}

export function getFileTypeIcon(mimeType: string | null): "image" | "pdf" | "design" | "spreadsheet" | "document" | "other" {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (["application/postscript", "image/svg+xml"].includes(mimeType)) return "design";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv") return "spreadsheet";
  if (mimeType.includes("word") || mimeType.includes("document")) return "document";
  return "other";
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
