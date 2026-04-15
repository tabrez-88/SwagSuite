import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { getUserId } from "../utils/getUserId";

const DEFAULT_MENTION_PREFS = { inApp: true, email: false, slack: false };

export class UserController {
  static async getTeam(req: Request, res: Response) {
    const { users } = await import("@shared/schema");

    const teamMembers = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      profileImageUrl: users.profileImageUrl,
    }).from(users);

    res.json(teamMembers);
  }

  static async getNotificationPreferences(req: Request, res: Response) {
    const userId = getUserId(req);
    const { users } = await import("@shared/schema");
    const [row] = await db.select({ notificationPreferences: users.notificationPreferences })
      .from(users).where(eq(users.id, userId)).limit(1);
    const prefs = (row?.notificationPreferences as any) || {};
    res.json({ mentions: { ...DEFAULT_MENTION_PREFS, ...(prefs.mentions || {}) } });
  }

  static async updateNotificationPreferences(req: Request, res: Response) {
    const userId = getUserId(req);
    const { mentions } = req.body || {};
    const { users } = await import("@shared/schema");
    const [current] = await db.select({ notificationPreferences: users.notificationPreferences })
      .from(users).where(eq(users.id, userId)).limit(1);
    const existing = (current?.notificationPreferences as any) || {};
    const updated = {
      ...existing,
      mentions: {
        ...DEFAULT_MENTION_PREFS,
        ...(existing.mentions || {}),
        ...(mentions || {}),
      },
    };
    await db.update(users).set({ notificationPreferences: updated as any, updatedAt: new Date() }).where(eq(users.id, userId));
    res.json(updated);
  }
}
