import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { NotificationController } from "../controllers/notification.controller";

const router = Router();

router.get("/api/notifications", isAuthenticated, asyncHandler(NotificationController.list));
router.get("/api/notifications/unread-count", isAuthenticated, asyncHandler(NotificationController.getUnreadCount));
router.patch("/api/notifications/:id/read", isAuthenticated, asyncHandler(NotificationController.markAsRead));
router.post("/api/notifications/mark-all-read", isAuthenticated, asyncHandler(NotificationController.markAllAsRead));
router.delete("/api/notifications/:id", isAuthenticated, asyncHandler(NotificationController.delete));

export default router;
