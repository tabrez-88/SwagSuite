import { deleteFromCloudinary } from "../config/cloudinary";
import { registerInMediaLibrary } from "../utils/registerInMediaLibrary";
import { mediaLibraryRepository } from "../repositories/mediaLibrary.repository";

export class MediaLibraryService {
  async list(filters: {
    folder?: string;
    category?: string;
    companyId?: string;
    orderId?: string;
    search?: string;
    mimeType?: string;
    limit?: number;
    offset?: number;
  }) {
    const [items, total] = await Promise.all([
      mediaLibraryRepository.getMediaLibraryItems(filters),
      mediaLibraryRepository.getMediaLibraryCount({ folder: filters.folder, category: filters.category, search: filters.search }),
    ]);
    return { items, total };
  }

  async getById(id: string) {
    return mediaLibraryRepository.getMediaLibraryItem(id);
  }

  async upload(files: Express.Multer.File[], userId: string, options: {
    folder?: string;
    category?: string;
    orderId?: string;
    companyId?: string;
  }) {
    return Promise.all(
      files.map(async (file) => {
        const cloudinaryUrl = (file as any).path;
        const publicId = (file as any).filename || (file as any).public_id;
        return registerInMediaLibrary({
          cloudinaryUrl,
          cloudinaryPublicId: publicId,
          fileName: publicId,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          folder: options.folder,
          category: options.category,
          orderId: options.orderId,
          companyId: options.companyId,
          sourceTable: "direct",
          sourceId: publicId,
          uploadedBy: userId,
        });
      })
    );
  }

  async update(id: string, updates: {
    tags?: string[];
    category?: string;
    description?: string;
    folder?: string;
    fileName?: string;
  }) {
    const data: any = {};
    if (updates.tags !== undefined) data.tags = updates.tags;
    if (updates.category !== undefined) data.category = updates.category;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.folder !== undefined) data.folder = updates.folder;
    if (updates.fileName !== undefined) data.fileName = updates.fileName;
    return mediaLibraryRepository.updateMediaLibraryItem(id, data);
  }

  async delete(id: string) {
    const item = await mediaLibraryRepository.getMediaLibraryItem(id);
    if (!item) return null;

    if (item.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(item.cloudinaryPublicId);
      } catch (e) {
        console.error("Failed to delete from Cloudinary:", e);
      }
    }

    await mediaLibraryRepository.deleteMediaLibraryItem(id);
    return { success: true };
  }

  async linkToOrder(orderId: string, mediaLibraryIds: string[], fileType: string, notes?: string) {
    const { db } = await import("../db");
    const { orderFiles } = await import("@shared/schema");

    const libraryItems = await mediaLibraryRepository.getMediaLibraryItemsByIds(mediaLibraryIds);
    const createdFiles = await Promise.all(
      libraryItems.map(async (item) => {
        const [fileRecord] = await db
          .insert(orderFiles)
          .values({
            orderId,
            fileName: item.fileName,
            originalName: item.originalName,
            fileSize: item.fileSize,
            mimeType: item.mimeType,
            filePath: item.cloudinaryUrl,
            thumbnailPath: item.thumbnailUrl,
            fileType,
            tags: [fileType],
            notes: notes || null,
            uploadedBy: item.uploadedBy,
          })
          .returning();
        return fileRecord;
      })
    );

    return createdFiles;
  }
}

export const mediaLibraryService = new MediaLibraryService();
