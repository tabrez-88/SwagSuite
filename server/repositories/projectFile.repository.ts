import { eq, and } from "drizzle-orm";
import { db } from "../db";

export class ProjectFileRepository {
  async getByOrderId(orderId: string) {
    const { orderFiles, orderItems, products, artworkApprovals, artworkFiles } = await import("@shared/schema");

    const files = await db
      .select({
        id: orderFiles.id,
        fileName: orderFiles.fileName,
        originalName: orderFiles.originalName,
        fileSize: orderFiles.fileSize,
        mimeType: orderFiles.mimeType,
        filePath: orderFiles.filePath,
        thumbnailPath: orderFiles.thumbnailPath,
        fileType: orderFiles.fileType,
        tags: orderFiles.tags,
        orderItemId: orderFiles.orderItemId,
        notes: orderFiles.notes,
        uploadedBy: orderFiles.uploadedBy,
        createdAt: orderFiles.createdAt,
        itemId: orderItems.id,
        itemColor: orderItems.color,
        itemSize: orderItems.size,
        itemQuantity: orderItems.quantity,
        productId: orderItems.productId,
        productName: products.name,
        productSku: products.sku,
      })
      .from(orderFiles)
      .leftJoin(orderItems, eq(orderFiles.orderItemId, orderItems.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderFiles.orderId, orderId))
      .orderBy(orderFiles.createdAt);

    // Get approval status
    let approvalMap = new Map();
    if (files.length > 0) {
      const approvals = await db
        .select({
          artworkFilePath: artworkFiles.filePath,
          status: artworkApprovals.status,
          approvedAt: artworkApprovals.approvedAt,
          declinedAt: artworkApprovals.declinedAt,
          declineReason: artworkApprovals.declineReason,
          approvalToken: artworkApprovals.approvalToken,
        })
        .from(artworkApprovals)
        .innerJoin(artworkFiles, eq(artworkApprovals.artworkFileId, artworkFiles.id))
        .where(eq(artworkApprovals.orderId, orderId));

      approvals.forEach(approval => {
        if (approval.artworkFilePath) {
          approvalMap.set(approval.artworkFilePath, {
            status: approval.status,
            approvedAt: approval.approvedAt,
            declinedAt: approval.declinedAt,
            feedback: approval.declineReason,
            approvalToken: approval.approvalToken,
          });
        }
      });
    }

    return files.map(file => ({
      id: file.id,
      fileName: file.fileName,
      originalName: file.originalName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      filePath: file.filePath,
      thumbnailPath: file.thumbnailPath,
      fileType: file.fileType,
      tags: file.tags,
      orderItemId: file.orderItemId,
      notes: file.notes,
      uploadedBy: file.uploadedBy,
      createdAt: file.createdAt,
      orderItem: file.itemId ? {
        id: file.itemId,
        color: file.itemColor,
        size: file.itemSize,
        quantity: file.itemQuantity,
        productId: file.productId,
        productName: file.productName,
        productSku: file.productSku,
      } : null,
      approval: file.fileType === "customer_proof" && approvalMap.has(file.filePath)
        ? approvalMap.get(file.filePath)
        : null,
    }));
  }

  async create(data: {
    orderId: string;
    orderItemId?: string | null;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    filePath: string;
    fileType: string;
    tags?: string[];
    notes?: string | null;
    uploadedBy?: string;
  }) {
    const { orderFiles } = await import("@shared/schema");

    const [fileRecord] = await db
      .insert(orderFiles)
      .values({
        orderId: data.orderId,
        orderItemId: data.orderItemId || null,
        fileName: data.fileName,
        originalName: data.originalName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        filePath: data.filePath,
        fileType: data.fileType,
        tags: data.tags || [data.fileType],
        notes: data.notes || null,
        uploadedBy: data.uploadedBy,
      })
      .returning();

    return fileRecord;
  }

  async getById(id: string, orderId?: string) {
    const { orderFiles } = await import("@shared/schema");

    const conditions = [eq(orderFiles.id, id)];
    if (orderId) conditions.push(eq(orderFiles.orderId, orderId));

    const [file] = await db
      .select()
      .from(orderFiles)
      .where(and(...conditions));

    return file;
  }

  async delete(id: string) {
    const { orderFiles } = await import("@shared/schema");
    await db.delete(orderFiles).where(eq(orderFiles.id, id));
  }

  async getOrder(orderId: string) {
    const { orders } = await import("@shared/schema");
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    return order;
  }

  async createArtworkFile(data: {
    orderId: string;
    fileName: string;
    filePath: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    uploadedBy?: string;
  }) {
    const { artworkFiles } = await import("@shared/schema");

    const [artworkFile] = await db
      .insert(artworkFiles)
      .values(data)
      .returning();

    return artworkFile;
  }

  async createArtworkApproval(data: {
    orderId: string;
    orderItemId?: string | null;
    artworkFileId: string;
    approvalToken: string;
    status: string;
    clientEmail?: string;
    clientName?: string | null;
    sentAt: Date;
  }) {
    const { artworkApprovals } = await import("@shared/schema");

    const [approval] = await db
      .insert(artworkApprovals)
      .values(data)
      .returning();

    return approval;
  }

  async getOrderItemWithProduct(orderItemId: string) {
    const { orderItems, products } = await import("@shared/schema");

    const [item] = await db
      .select({
        productId: orderItems.productId,
        productName: products.name,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.id, orderItemId));

    return item;
  }

  async updateOrderStatus(orderId: string, status: string) {
    const { orders } = await import("@shared/schema");
    await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  }

  async updateOrderStage(orderId: string, stage: string, stagesCompleted: any) {
    const { orders } = await import("@shared/schema");
    await db
      .update(orders)
      .set({
        currentStage: stage,
        stagesCompleted,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }
}

export const projectFileRepository = new ProjectFileRepository();
