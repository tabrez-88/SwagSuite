import { Router } from "express";
import { CommunicationController } from "../controllers/communication.controller";
import { AttachmentController } from "../controllers/attachment.controller";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { upload } from "../config/cloudinary";

const router = Router();

// Communications (order emails)
router.get("/api/orders/:orderId/communications", asyncHandler(CommunicationController.list));
router.post("/api/orders/:orderId/communications", asyncHandler(CommunicationController.create));

// General email (no order context)
router.post("/api/send-email", isAuthenticated, asyncHandler(CommunicationController.sendEmail));

// Attachments
router.get("/api/orders/:orderId/attachments", isAuthenticated, asyncHandler(AttachmentController.list));
router.post("/api/orders/:orderId/attachments", isAuthenticated, upload.array('files', 10), asyncHandler(AttachmentController.upload));
router.get("/api/attachments/:attachmentId/download", isAuthenticated, asyncHandler(AttachmentController.download));
router.delete("/api/attachments/:attachmentId", isAuthenticated, asyncHandler(AttachmentController.delete));

export default router;
