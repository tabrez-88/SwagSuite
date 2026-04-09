import type { RequestHandler } from "express";
import { userRepository } from "../repositories/user.repository";

/**
 * Middleware that enforces admin-only access.
 * Must be used after `isAuthenticated`.
 * Looks up the user from DB to verify `role === "admin"`.
 */
export const isAdmin: RequestHandler = async (req, res, next) => {
  const sessionUser = req.user as any;
  const userId = sessionUser?.claims?.sub;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Dev auto-login user is always admin (set in config/auth.ts)
  if (userId === "dev-user-id") {
    return next();
  }

  try {
    const user = await userRepository.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    return next();
  } catch (error) {
    console.error("isAdmin middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
