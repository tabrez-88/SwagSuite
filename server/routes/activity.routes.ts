import { Router } from "express";
import { ActivityController } from "../controllers/activity.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { upload } from "../config/cloudinary";

const router = Router();

// Project activities
router.get("/api/projects/:projectId/activities", asyncHandler(ActivityController.list));
router.post("/api/projects/:projectId/activities", asyncHandler(ActivityController.create));

// Project file upload/download
router.post("/api/projects/:projectId/upload", isAuthenticated, upload.single('file'), asyncHandler(ActivityController.uploadFile));
router.get("/api/projects/:projectId/files/:activityId", asyncHandler(ActivityController.downloadFile));

export default router;
