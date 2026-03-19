import type { Request, Response } from "express";
import { db } from "../db";

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
}
