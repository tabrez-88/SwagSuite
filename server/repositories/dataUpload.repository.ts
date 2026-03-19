import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  dataUploads,
  type DataUpload,
  type InsertDataUpload,
} from "@shared/schema";

export class DataUploadRepository {
  async createDataUpload(upload: InsertDataUpload): Promise<DataUpload> {
    const [newUpload] = await db
      .insert(dataUploads)
      .values(upload)
      .returning();
    return newUpload;
  }

  async getDataUploads(): Promise<DataUpload[]> {
    return await db
      .select()
      .from(dataUploads)
      .orderBy(desc(dataUploads.createdAt));
  }

  async updateDataUpload(
    id: string,
    updates: Partial<DataUpload>
  ): Promise<DataUpload> {
    const [updatedUpload] = await db
      .update(dataUploads)
      .set(updates)
      .where(eq(dataUploads.id, id))
      .returning();
    return updatedUpload;
  }

  async deleteDataUpload(id: string): Promise<void> {
    await db.delete(dataUploads).where(eq(dataUploads.id, id));
  }
}

export const dataUploadRepository = new DataUploadRepository();
