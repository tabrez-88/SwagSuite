import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  userInvitations,
  passwordResets,
  type User,
  type UpsertUser,
  type UserInvitation,
  type InsertUserInvitation,
  type PasswordReset,
  type InsertPasswordReset,
} from "@shared/schema";

export class UserRepository {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date(), // Set updatedAt as lastActive
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          // Only update role if explicitly provided (for first-time setup)
          ...(userData.role && { role: userData.role }),
          updatedAt: new Date(), // Update on every login
        },
      })
      .returning();
    return user;
  }

  // User Invitation operations
  async createUserInvitation(invitation: InsertUserInvitation): Promise<UserInvitation> {
    const [newInvitation] = await db
      .insert(userInvitations)
      .values(invitation)
      .returning();
    return newInvitation;
  }

  async getUserInvitationByToken(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.token, token));
    return invitation;
  }

  async getUserInvitationByEmail(email: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(
        and(
          eq(userInvitations.email, email),
          sql`${userInvitations.acceptedAt} IS NULL`,
          sql`${userInvitations.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(userInvitations.createdAt))
      .limit(1);
    return invitation;
  }

  async getPendingInvitations(): Promise<UserInvitation[]> {
    return await db
      .select()
      .from(userInvitations)
      .where(
        and(
          sql`${userInvitations.acceptedAt} IS NULL`,
          sql`${userInvitations.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(userInvitations.createdAt));
  }

  async markInvitationAccepted(token: string): Promise<void> {
    await db
      .update(userInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(userInvitations.token, token));
  }

  async deleteInvitation(id: string): Promise<void> {
    await db.delete(userInvitations).where(eq(userInvitations.id, id));
  }

  // Password Reset operations
  async createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset> {
    const [newReset] = await db
      .insert(passwordResets)
      .values(reset)
      .returning();
    return newReset;
  }

  async getPasswordResetByToken(token: string): Promise<PasswordReset | undefined> {
    const [reset] = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.token, token),
          sql`${passwordResets.usedAt} IS NULL`,
          sql`${passwordResets.expiresAt} > NOW()`
        )
      );
    return reset;
  }

  async markPasswordResetUsed(token: string): Promise<void> {
    await db
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(eq(passwordResets.token, token));
  }

  // User lookup operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  // Two-Factor Authentication methods
  async setTwoFactorSecret(userId: string, encryptedSecret: string): Promise<void> {
    await db
      .update(users)
      .set({ twoFactorSecret: encryptedSecret, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async enableTwoFactor(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ twoFactorEnabled: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async setTwoFactorBackupCodes(
    userId: string,
    codes: { hash: string; used: boolean }[]
  ): Promise<void> {
    await db
      .update(users)
      .set({ twoFactorBackupCodes: codes, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}

export const userRepository = new UserRepository();
