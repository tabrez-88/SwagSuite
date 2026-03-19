import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";

export class CommunicationRepository {
  async getByOrderId(orderId: string, type?: string) {
    const { users } = await import("@shared/schema");
    const { communications } = await import("@shared/project-schema");

    let query = db
      .select({
        id: communications.id,
        orderId: communications.orderId,
        userId: communications.userId,
        communicationType: communications.communicationType,
        direction: communications.direction,
        recipientEmail: communications.recipientEmail,
        recipientName: communications.recipientName,
        subject: communications.subject,
        body: communications.body,
        metadata: communications.metadata,
        sentAt: communications.sentAt,
        createdAt: communications.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(communications)
      .leftJoin(users, eq(communications.userId, users.id))
      .$dynamic();

    if (type) {
      query = query.where(
        and(
          eq(communications.orderId, orderId),
          eq(communications.communicationType, type)
        )
      );
    } else {
      query = query.where(eq(communications.orderId, orderId));
    }

    return query.orderBy(desc(communications.sentAt));
  }

  async create(data: any) {
    const { communications, insertCommunicationSchema } = await import("@shared/project-schema");
    const validatedData = insertCommunicationSchema.parse(data);
    const [newCommunication] = await db
      .insert(communications)
      .values(validatedData)
      .returning();
    return newCommunication;
  }

  async getWithUser(communicationId: string) {
    const { users } = await import("@shared/schema");
    const { communications } = await import("@shared/project-schema");

    const [result] = await db
      .select({
        id: communications.id,
        orderId: communications.orderId,
        userId: communications.userId,
        communicationType: communications.communicationType,
        direction: communications.direction,
        recipientEmail: communications.recipientEmail,
        recipientName: communications.recipientName,
        subject: communications.subject,
        body: communications.body,
        metadata: communications.metadata,
        sentAt: communications.sentAt,
        createdAt: communications.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(communications)
      .leftJoin(users, eq(communications.userId, users.id))
      .where(eq(communications.id, communicationId));

    return result;
  }

  async linkAttachments(communicationId: string, attachmentIds: string[]) {
    const { attachments } = await import("@shared/project-schema");
    await db
      .update(attachments)
      .set({ communicationId })
      .where(inArray(attachments.id, attachmentIds));
  }

  async getAttachmentsByIds(attachmentIds: string[]) {
    const { attachments } = await import("@shared/project-schema");
    return db
      .select()
      .from(attachments)
      .where(inArray(attachments.id, attachmentIds));
  }
}

export const communicationRepository = new CommunicationRepository();
