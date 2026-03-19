import type { Request, Response } from "express";
import { userRepository } from "../repositories/user.repository";
import { activityRepository } from "../repositories/activity.repository";

export class AuthController {
  static async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user.claims.sub;
      let user = await userRepository.getUser(userId);

      // If user not found in database, auto-register them
      if (!user) {
        const claims = (req as any).user.claims;
        const { db } = await import("../db");
        const { users } = await import("@shared/schema");
        const { count } = await import("drizzle-orm");

        // Check if this is the first user (should be admin)
        const userCount = await db.select({ count: count() }).from(users);
        const isFirstUser = userCount[0].count === 0;

        // Get default role from env or use 'user'
        const defaultRole = process.env.DEFAULT_USER_ROLE || "user";
        const role = isFirstUser ? "admin" : defaultRole;

        // Create user from auth claims
        user = await userRepository.upsertUser({
          id: userId,
          email: claims.email || `${userId}@unknown.com`,
          firstName: claims.given_name || claims.name?.split(' ')[0] || 'User',
          lastName: claims.family_name || claims.name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: claims.picture,
          role: role,
        });

        console.log(`Auto-registered user ${userId} with role ${role}`);
      }

      // Strip sensitive 2FA fields from response
      const { twoFactorSecret, twoFactorBackupCodes, password, ...safeUser } = user as any;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  }

  static async createInvitation(req: Request, res: Response) {
    try {
      const { email, role } = req.body;
      const currentUser = await userRepository.getUser((req as any).user.claims.sub);

      // Check if current user is admin or manager
      if (!currentUser || !['admin', 'manager'].includes(currentUser.role || '')) {
        return res.status(403).json({ message: "Only administrators and managers can invite users" });
      }

      // Validate email
      const { validateEmail } = await import("../utils/password");
      const emailError = validateEmail(email);
      if (emailError) {
        return res.status(400).json({ message: emailError });
      }

      // Check if user already exists
      const existingUser = await userRepository.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Check if there's already a pending invitation
      const existingInvitation = await userRepository.getUserInvitationByEmail(email);
      if (existingInvitation) {
        return res.status(400).json({ message: "Invitation already sent to this email" });
      }

      // Generate invitation token
      const { generateInvitationToken } = await import("../utils/password");
      const { token, expiresAt } = generateInvitationToken();

      // Create invitation
      const invitation = await userRepository.createUserInvitation({
        email,
        role: role || 'user',
        token,
        invitedBy: currentUser.id,
        expiresAt,
      });

      // Send invitation email
      const invitationUrl = `${req.protocol}://${req.get('host')}/accept-invitation?token=${token}`;
      console.log(`Invitation URL: ${invitationUrl}`);

      try {
        const { emailService } = await import("../services/email.service");
        await emailService.sendEmail({
          to: email,
          subject: `You're invited to join SwagSuite`,
          userId: currentUser.id,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background-color: #2563eb; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SwagSuite</h1>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #1f2937; margin-top: 0;">You're Invited!</h2>
                  <p style="color: #374151; line-height: 1.6;">
                    <strong>${currentUser.firstName} ${currentUser.lastName}</strong> has invited you to join SwagSuite as a <strong>${role || 'user'}</strong>.
                  </p>
                  <p style="color: #374151; line-height: 1.6;">
                    Click the button below to create your account and get started.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${invitationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                      Accept Invitation
                    </a>
                  </div>
                  <p style="color: #6b7280; font-size: 13px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${invitationUrl}" style="color: #2563eb; word-break: break-all;">${invitationUrl}</a>
                  </p>
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 15px; margin-top: 20px; border-radius: 4px;">
                    <p style="color: #92400e; margin: 0; font-size: 13px;">This invitation expires in 7 days.</p>
                  </div>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent from SwagSuite</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `You're invited to join SwagSuite!\n\n${currentUser.firstName} ${currentUser.lastName} has invited you as a ${role || 'user'}.\n\nAccept your invitation: ${invitationUrl}\n\nThis invitation expires in 7 days.`,
        });
        console.log(`✓ Invitation email sent to ${email}`);
      } catch (emailError) {
        console.error(`⚠️ Failed to send invitation email to ${email}:`, emailError);
        // Don't fail the invitation creation if email fails
      }

      // Log activity
      await activityRepository.createActivity({
        userId: currentUser.id,
        entityType: 'user_invitation',
        entityId: invitation.id,
        action: 'created',
        description: `Invited ${email} as ${role}`,
      });

      res.json({
        message: "Invitation sent successfully",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
        invitationUrl, // For development
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  }

  static async getPendingInvitations(req: Request, res: Response) {
    try {
      const currentUser = await userRepository.getUser((req as any).user.claims.sub);

      if (!currentUser || !['admin', 'manager'].includes(currentUser.role || '')) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const invitations = await userRepository.getPendingInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  }

  static async acceptInvitation(req: Request, res: Response) {
    try {
      const { token, username, password, firstName, lastName } = req.body;

      // Validate inputs
      const { validateUsername, validatePassword, hashPassword } = await import("../utils/password");

      const usernameError = validateUsername(username);
      if (usernameError) {
        return res.status(400).json({ message: usernameError });
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        return res.status(400).json({ message: passwordError });
      }

      // Get invitation
      const invitation = await userRepository.getUserInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invalid or expired invitation" });
      }

      // Check if username already exists
      const existingUser = await userRepository.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Check if email already exists
      const existingEmailUser = await userRepository.getUserByEmail(invitation.email);
      if (existingEmailUser) {
        return res.status(400).json({ message: "User already registered" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const newUser = await userRepository.upsertUser({
        email: invitation.email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        role: invitation.role as any,
        authProvider: 'local',
        isActive: true,
      });

      // Mark invitation as accepted
      await userRepository.markInvitationAccepted(token);

      // Log activity
      await activityRepository.createActivity({
        userId: newUser.id,
        entityType: 'user',
        entityId: newUser.id,
        action: 'created',
        description: `Accepted invitation and created account`,
      });

      res.json({
        message: "Account created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  }

  static async verifyInvitation(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const invitation = await userRepository.getUserInvitationByToken(token);

      if (!invitation) {
        return res.status(404).json({
          valid: false,
          message: "Invalid or expired invitation"
        });
      }

      res.json({
        valid: true,
        email: invitation.email,
        role: invitation.role,
      });
    } catch (error) {
      console.error("Error verifying invitation:", error);
      res.status(500).json({ message: "Failed to verify invitation" });
    }
  }

  static async deleteInvitation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUser = await userRepository.getUser((req as any).user.claims.sub);

      if (!currentUser || !['admin', 'manager'].includes(currentUser.role || '')) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await userRepository.deleteInvitation(id);
      res.json({ message: "Invitation deleted successfully" });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await userRepository.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({ message: "If an account exists, a password reset email has been sent" });
      }

      // Check if user has local auth
      if (user.authProvider !== 'local') {
        return res.status(400).json({ message: "This account uses OAuth login" });
      }

      // Generate reset token
      const { generatePasswordResetToken } = await import("../utils/password");
      const { token, expiresAt } = generatePasswordResetToken();

      // Create password reset
      await userRepository.createPasswordReset({
        userId: user.id,
        token,
        expiresAt,
      });

      // TODO: Send email with reset link
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
      console.log(`Password reset URL: ${resetUrl}`);

      res.json({ message: "If an account exists, a password reset email has been sent" });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      // Validate password
      const { validatePassword, hashPassword } = await import("../utils/password");
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        return res.status(400).json({ message: passwordError });
      }

      // Get reset token
      const reset = await userRepository.getPasswordResetByToken(token);
      if (!reset) {
        return res.status(404).json({ message: "Invalid or expired reset token" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await userRepository.updateUserPassword(reset.userId, hashedPassword);

      // Mark reset token as used
      await userRepository.markPasswordResetUsed(token);

      // Log activity
      await activityRepository.createActivity({
        userId: reset.userId,
        entityType: 'user',
        entityId: reset.userId,
        action: 'updated',
        description: 'Password reset',
      });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  }

  static async listUsers(req: Request, res: Response) {
    try {
      const allUsers = await userRepository.getAllUsers();

      // Remove sensitive data
      const sanitizedUsers = allUsers.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        authProvider: user.authProvider,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }

  static async updateUserRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Check if current user is admin
      const currentUser = await userRepository.getUser((req as any).user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can update user roles" });
      }

      // Validate role
      if (!['admin', 'manager', 'user'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const { db } = await import("../db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [updatedUser] = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log activity
      await activityRepository.createActivity({
        userId: (req as any).user.claims.sub,
        entityType: 'user',
        entityId: id,
        action: 'updated',
        description: `Updated user role to ${role}`,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  }

  static async uploadAvatar(req: Request, res: Response) {
    const { avatarUpload } = await import("../config/cloudinary");

    avatarUpload.single('avatar')(req, res, async (err: any) => {
      if (err) {
        console.error("Avatar upload error:", err);
        return res.status(400).json({ message: err.message || "Failed to upload avatar" });
      }

      try {
        const file = req.file as Express.Multer.File & { path: string };

        if (!file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const userId = (req as any).user?.claims?.sub;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // Update user's profileImageUrl
        const { db } = await import("../db");
        const { users } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");

        const [updatedUser] = await db
          .update(users)
          .set({
            profileImageUrl: file.path,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId))
          .returning();

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // Log activity
        await activityRepository.createActivity({
          userId: userId,
          entityType: 'user',
          entityId: userId,
          action: 'updated',
          description: 'Updated profile avatar',
        });

        res.json({
          message: "Avatar uploaded successfully",
          profileImageUrl: file.path
        });
      } catch (error) {
        console.error("Error saving avatar:", error);
        res.status(500).json({ message: "Failed to save avatar" });
      }
    });
  }

  static async updateProfileImage(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { profileImageUrl } = req.body;
      if (!profileImageUrl || typeof profileImageUrl !== 'string') {
        return res.status(400).json({ message: "profileImageUrl is required" });
      }

      const { db } = await import("../db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [updatedUser] = await db
        .update(users)
        .set({
          profileImageUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile image updated successfully",
        profileImageUrl: updatedUser.profileImageUrl
      });
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  }
}
