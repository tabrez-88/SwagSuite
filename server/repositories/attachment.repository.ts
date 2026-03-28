import { and, eq } from "drizzle-orm";
import { db } from "../db";

export class AttachmentRepository {
  async getByOrderId(orderId: string, category?: string) {
    const { attachments } = await import("@shared/schema");

    const conditions = [eq(attachments.orderId, orderId)];
    if (category) {
      conditions.push(eq(attachments.category, category));
    }

    return db
      .select()
      .from(attachments)
      .where(and(...conditions));
  }

  async getById(id: string) {
    const { attachments } = await import("@shared/schema");
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id));
    return attachment;
  }

  async create(data: any) {
    const { attachments } = await import("@shared/schema");
    const [attachment] = await db
      .insert(attachments)
      .values(data)
      .returning();
    return attachment;
  }

  async delete(id: string) {
    const { attachments } = await import("@shared/schema");
    await db.delete(attachments).where(eq(attachments.id, id));
  }
}

export const attachmentRepository = new AttachmentRepository();
