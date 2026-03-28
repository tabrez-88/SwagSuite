import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";

export class ActivityRepository {
  async getByOrderId(orderId: string) {
    const { users } = await import("@shared/schema");
    const { projectActivities } = await import("@shared/schema");

    return db
      .select({
        id: projectActivities.id,
        orderId: projectActivities.orderId,
        userId: projectActivities.userId,
        activityType: projectActivities.activityType,
        content: projectActivities.content,
        metadata: projectActivities.metadata,
        mentionedUsers: projectActivities.mentionedUsers,
        isSystemGenerated: projectActivities.isSystemGenerated,
        createdAt: projectActivities.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(projectActivities)
      .leftJoin(users, eq(projectActivities.userId, users.id))
      .where(eq(projectActivities.orderId, orderId))
      .orderBy(desc(projectActivities.createdAt));
  }

  async create(data: any) {
    const { projectActivities, insertProjectActivitySchema } = await import("@shared/schema");
    const validatedData = insertProjectActivitySchema.parse(data);
    const [newActivity] = await db
      .insert(projectActivities)
      .values(validatedData)
      .returning();
    return newActivity;
  }

  async getWithUser(activityId: string) {
    const { users } = await import("@shared/schema");
    const { projectActivities } = await import("@shared/schema");

    const [activity] = await db
      .select({
        id: projectActivities.id,
        orderId: projectActivities.orderId,
        userId: projectActivities.userId,
        activityType: projectActivities.activityType,
        content: projectActivities.content,
        metadata: projectActivities.metadata,
        mentionedUsers: projectActivities.mentionedUsers,
        isSystemGenerated: projectActivities.isSystemGenerated,
        createdAt: projectActivities.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(projectActivities)
      .leftJoin(users, eq(projectActivities.userId, users.id))
      .where(eq(projectActivities.id, activityId));

    return activity;
  }

  // ---- Generic activities table (system/auth events) ----

  async getActivities(entityType?: string, entityId?: string) {
    const { activities } = await import("@shared/schema");

    const query = db.select().from(activities);

    if (entityType && entityId) {
      return await query.where(
        and(eq(activities.entityType, entityType), eq(activities.entityId, entityId))
      ).orderBy(desc(activities.createdAt));
    } else if (entityType) {
      return await query.where(eq(activities.entityType, entityType))
        .orderBy(desc(activities.createdAt));
    }

    return await query.orderBy(desc(activities.createdAt)).limit(50);
  }

  async createActivity(data: any) {
    const { activities } = await import("@shared/schema");
    const [newActivity] = await db.insert(activities).values(data).returning();
    return newActivity;
  }

  // ---- Project activities helpers ----

  async getFileActivity(orderId: string, activityId: string) {
    const { projectActivities } = await import("@shared/schema");

    const [activity] = await db
      .select()
      .from(projectActivities)
      .where(
        and(
          eq(projectActivities.id, activityId),
          eq(projectActivities.orderId, orderId),
          eq(projectActivities.activityType, "file_upload")
        )
      );

    return activity;
  }
}

export const activityRepository = new ActivityRepository();
