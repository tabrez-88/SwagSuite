import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import {
  presentations,
  presentationFiles,
  presentationProducts,
  type Presentation,
  type InsertPresentation,
  type PresentationFile,
  type InsertPresentationFile,
  type PresentationProduct,
  type InsertPresentationProduct,
} from "@shared/schema";

export class PresentationRepository {
  async getPresentations(userId: string): Promise<Presentation[]> {
    return await db
      .select()
      .from(presentations)
      .where(eq(presentations.userId, userId))
      .orderBy(desc(presentations.createdAt));
  }

  async getPresentation(id: string): Promise<Presentation | undefined> {
    const [presentation] = await db
      .select()
      .from(presentations)
      .where(eq(presentations.id, id));
    return presentation;
  }

  async createPresentation(
    presentation: InsertPresentation
  ): Promise<Presentation> {
    const [newPresentation] = await db
      .insert(presentations)
      .values(presentation)
      .returning();
    return newPresentation;
  }

  async updatePresentation(
    id: string,
    presentation: Partial<InsertPresentation>
  ): Promise<Presentation> {
    const [updatedPresentation] = await db
      .update(presentations)
      .set({ ...presentation, updatedAt: new Date() })
      .where(eq(presentations.id, id))
      .returning();
    return updatedPresentation;
  }

  async deletePresentation(id: string): Promise<void> {
    // Delete associated files first
    await db
      .delete(presentationFiles)
      .where(eq(presentationFiles.presentationId, id));
    // Delete associated products
    await db
      .delete(presentationProducts)
      .where(eq(presentationProducts.presentationId, id));
    // Delete presentation
    await db.delete(presentations).where(eq(presentations.id, id));
  }

  async createPresentationFile(
    file: InsertPresentationFile
  ): Promise<PresentationFile> {
    const [newFile] = await db
      .insert(presentationFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async getPresentationFiles(
    presentationId: string
  ): Promise<PresentationFile[]> {
    return await db
      .select()
      .from(presentationFiles)
      .where(eq(presentationFiles.presentationId, presentationId))
      .orderBy(desc(presentationFiles.uploadedAt));
  }

  async createPresentationProduct(
    product: InsertPresentationProduct
  ): Promise<PresentationProduct> {
    const [newProduct] = await db
      .insert(presentationProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async getPresentationProducts(
    presentationId: string
  ): Promise<PresentationProduct[]> {
    return await db
      .select()
      .from(presentationProducts)
      .where(eq(presentationProducts.presentationId, presentationId))
      .orderBy(desc(presentationProducts.createdAt));
  }
}

export const presentationRepository = new PresentationRepository();
