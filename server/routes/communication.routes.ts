import { Router } from "express";
import { CommunicationController } from "../controllers/communication.controller";
import { AttachmentController } from "../controllers/attachment.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { upload } from "../config/cloudinary";

const router = Router();

// Communications (project emails)
router.get("/api/projects/:projectId/communications", asyncHandler(CommunicationController.list));
router.post("/api/projects/:projectId/communications", asyncHandler(CommunicationController.create));

// General email (no order context)
router.post("/api/send-email", isAuthenticated, asyncHandler(CommunicationController.sendEmail));

// Email preview (resolve merge tags for live preview)
router.post("/api/email/preview", isAuthenticated, asyncHandler(CommunicationController.previewEmail));

// Attachments
router.get("/api/projects/:projectId/attachments", isAuthenticated, asyncHandler(AttachmentController.list));
router.post("/api/projects/:projectId/attachments", isAuthenticated, upload.array('files', 10), asyncHandler(AttachmentController.upload));
router.get("/api/attachments/:attachmentId/download", isAuthenticated, asyncHandler(AttachmentController.download));
router.delete("/api/attachments/:attachmentId", isAuthenticated, asyncHandler(AttachmentController.delete));

export default router;
