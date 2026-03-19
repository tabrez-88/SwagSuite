import { mediaLibraryRepository } from "../repositories/mediaLibrary.repository";

interface RegisterMediaLibraryParams {
  cloudinaryUrl: string;
  cloudinaryPublicId?: string;
  fileName: string;
  originalName: string;
  fileSize?: number;
  mimeType?: string;
  folder?: string;
  category?: string;
  orderId?: string;
  companyId?: string;
  orderItemId?: string;
  sourceTable: string;
  sourceId: string;
  uploadedBy?: string;
  tags?: string[];
}

function determineFolderFromExt(extension: string): string {
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp"];
  if (imageExts.includes(extension)) return "images";
  if (extension === "pdf") return "documents";
  if (["ai", "eps", "svg", "psd"].includes(extension)) return "design-files";
  if (["xlsx", "xls", "csv"].includes(extension)) return "spreadsheets";
  if (["docx", "doc"].includes(extension)) return "documents";
  return "general";
}

export async function registerInMediaLibrary(params: RegisterMediaLibraryParams) {
  const ext = params.originalName.split(".").pop()?.toLowerCase() || "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp"];
  const thumbnailUrl = imageExts.includes(ext) ? params.cloudinaryUrl : null;

  return mediaLibraryRepository.createMediaLibraryItem({
    cloudinaryUrl: params.cloudinaryUrl,
    cloudinaryPublicId: params.cloudinaryPublicId || null,
    cloudinaryResourceType: ext === "pdf" ? "raw" : "auto",
    fileName: params.fileName,
    originalName: params.originalName,
    fileSize: params.fileSize || null,
    mimeType: params.mimeType || null,
    fileExtension: ext || null,
    thumbnailUrl,
    folder: params.folder || determineFolderFromExt(ext),
    category: params.category || null,
    orderId: params.orderId || null,
    companyId: params.companyId || null,
    orderItemId: params.orderItemId || null,
    sourceTable: params.sourceTable,
    sourceId: params.sourceId,
    uploadedBy: params.uploadedBy || null,
    tags: params.tags || [],
  });
}
