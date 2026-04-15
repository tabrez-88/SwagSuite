import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Team members for @ mentions and assignments
router.get("/api/users/team", asyncHandler(UserController.getTeam));

// Notification preferences (current user)
router.get("/api/users/me/notification-preferences", isAuthenticated, asyncHandler(UserController.getNotificationPreferences));
router.patch("/api/users/me/notification-preferences", isAuthenticated, asyncHandler(UserController.updateNotificationPreferences));

export default router;
