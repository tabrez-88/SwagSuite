import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db";

export class DocumentRepository {
  async getByOrderId(orderId: string) {
    const { generatedDocuments, users } = await import("@shared/schema");

    return db
      .select({
        id: generatedDocuments.id,
        orderId: generatedDocuments.orderId,
        documentType: generatedDocuments.documentType,
        documentNumber: generatedDocuments.documentNumber,
        vendorId: generatedDocuments.vendorId,
        vendorName: generatedDocuments.vendorName,
        fileUrl: generatedDocuments.fileUrl,
        fileName: generatedDocuments.fileName,
        fileSize: generatedDocuments.fileSize,
        status: generatedDocuments.status,
        generatedBy: generatedDocuments.generatedBy,
        sentAt: generatedDocuments.sentAt,
        metadata: generatedDocuments.metadata,
        createdAt: generatedDocuments.createdAt,
        updatedAt: generatedDocuments.updatedAt,
        generatedByName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        generatedByEmail: users.email,
      })
      .from(generatedDocuments)
      .leftJoin(users, eq(generatedDocuments.generatedBy, users.id))
      .where(eq(generatedDocuments.orderId, orderId))
      .orderBy(desc(generatedDocuments.createdAt));
  }

  async getById(id: string) {
    const { generatedDocuments } = await import("@shared/schema");
    const [doc] = await db
      .select()
      .from(generatedDocuments)
      .where(eq(generatedDocuments.id, id));
    return doc;
  }

  async findExisting(orderId: string, documentType: string, vendorId?: string) {
    const { generatedDocuments } = await import("@shared/schema");

    const conditions = [
      eq(generatedDocuments.orderId, orderId),
      eq(generatedDocuments.documentType, documentType),
    ];
    if (vendorId) {
      conditions.push(eq(generatedDocuments.vendorId, vendorId));
    }

    return db
      .select()
      .from(generatedDocuments)
      .where(and(...conditions));
  }

  async create(data: {
    orderId: string;
    documentType: string;
    documentNumber: string;
    vendorId?: string | null;
    vendorName?: string | null;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    status?: string;
    generatedBy?: string;
    metadata?: any;
  }) {
    const { generatedDocuments } = await import("@shared/schema");

    const [document] = await db
      .insert(generatedDocuments)
      .values({
        orderId: data.orderId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        vendorId: data.vendorId || null,
        vendorName: data.vendorName || null,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        status: data.status || "draft",
        generatedBy: data.generatedBy,
        metadata: data.metadata || {},
      })
      .returning();

    return document;
  }

  async update(id: string, data: { status?: string; sentAt?: Date; metadata?: any }) {
    const { generatedDocuments } = await import("@shared/schema");

    const updates: any = { updatedAt: new Date() };
    if (data.status) updates.status = data.status;
    if (data.sentAt) updates.sentAt = data.sentAt;
    if (data.metadata) updates.metadata = data.metadata;

    const [updated] = await db
      .update(generatedDocuments)
      .set(updates)
      .where(eq(generatedDocuments.id, id))
      .returning();

    return updated;
  }

  async delete(id: string) {
    const { generatedDocuments } = await import("@shared/schema");
    await db.delete(generatedDocuments).where(eq(generatedDocuments.id, id));
  }

  async getAllPOsForOrder(orderId: string) {
    const { generatedDocuments } = await import("@shared/schema");

    return db
      .select()
      .from(generatedDocuments)
      .where(
        and(
          eq(generatedDocuments.orderId, orderId),
          eq(generatedDocuments.documentType, "purchase_order")
        )
      );
  }

  async updatePendingApprovals(orderId: string, documentId: string, fileUrl: string) {
    const { quoteApprovals } = await import("@shared/schema");

    const pendingApprovals = await db
      .select()
      .from(quoteApprovals)
      .where(and(eq(quoteApprovals.orderId, orderId), eq(quoteApprovals.status, "pending")));

    for (const approval of pendingApprovals) {
      await db
        .update(quoteApprovals)
        .set({
          documentId,
          pdfPath: fileUrl,
          updatedAt: new Date(),
        })
        .where(eq(quoteApprovals.id, approval.id));
    }

    return pendingApprovals.length;
  }
}

export const documentRepository = new DocumentRepository();
