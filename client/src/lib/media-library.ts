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
  const cleanUrl = url.split("?")[0].toLowerCase();
  // Design files (AI/EPS/PSD) need explicit PNG conversion + page 1 extraction
  const isDesignFile = /\.(ai|eps|psd)$/.test(cleanUrl);
  const format = isDesignFile ? "f_png,pg_1,cs_srgb" : "f_auto";
  // Raw uploads of design files must be switched to /image/upload/ for transformations
  let transformed = url;
  if (isDesignFile && cleanUrl.includes("/raw/upload/")) {
    transformed = url.replace("/raw/upload/", "/image/upload/");
  }
  return transformed.replace("/upload/", `/upload/w_${width},h_${height},c_fill,q_auto,${format}/`);
}

export function isImageFile(mimeType: string | null, url?: string | null): boolean {
  if (mimeType?.startsWith("image/")) return true;
  if (url) {
    const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
    // Standard image extensions
    if (/\.(jpe?g|png|gif|webp|svg|bmp|ico|tiff?)$/.test(cleanUrl)) return true;
    // Cloudinary image uploads (includes design files that Cloudinary can render)
    if (cleanUrl.includes("/image/upload/")) return true;
    // Design files on Cloudinary (both /image/upload/ and /raw/upload/) — renderable via f_png transform
    if (cleanUrl.includes("cloudinary.com") && /\.(ai|eps|psd)$/.test(cleanUrl)) return true;
  }
  return false;
}

/**
 * Get a browser-renderable image URL. For design files (.ai, .eps, .psd) on Cloudinary,
 * adds format transformation (f_png) so Cloudinary converts them to PNG.
 * Returns null if the URL can't be rendered as an image.
 */
export function getRenderableImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  const isDesignFile = /\.(ai|eps|psd)$/.test(cleanUrl);

  // Cloudinary raw uploads of design files — switch to /image/upload/ with PNG conversion
  if (cleanUrl.includes("/raw/upload/") && isDesignFile && cleanUrl.includes("cloudinary.com")) {
    return url.replace("/raw/upload/", "/image/upload/f_png,pg_1,cs_srgb/");
  }

  // Other Cloudinary raw uploads can't be transformed — not renderable
  if (cleanUrl.includes("/raw/upload/")) return null;

  // Non-Cloudinary design files — browser can't render
  if (!cleanUrl.includes("cloudinary.com") && /\.(ai|eps|psd|indd|cdr|sketch|fig)$/.test(cleanUrl)) return null;

  // Cloudinary image uploads of design files — add f_png transformation
  if (cleanUrl.includes("/image/upload/") && isDesignFile) {
    return url.replace("/image/upload/", "/image/upload/f_png,pg_1,cs_srgb/");
  }

  // Standard browser-renderable images
  if (/\.(jpe?g|png|gif|webp|svg|bmp|ico|tiff?)$/.test(cleanUrl) || cleanUrl.includes("/image/upload/")) {
    return url;
  }

  return null;
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
